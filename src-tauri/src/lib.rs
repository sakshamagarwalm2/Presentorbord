use std::fs;
use std::path::PathBuf;
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

struct BrowserState {
    label: Option<String>,
}

fn get_app_data_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("failed to get app data dir")
}

fn get_log_dir(app: &AppHandle) -> PathBuf {
    let dir = get_app_data_dir(app).join("logs");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn chrono_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    let millis = now.subsec_millis();
    format!("{}.{:03}", secs, millis)
}

#[tauri::command]
fn log_message(message: String) {
    println!("[Renderer] {}", message);
}

#[tauri::command]
fn get_log_path(app: AppHandle) -> Result<String, String> {
    let log_dir = get_log_dir(&app);
    let log_file = log_dir.join("renderer.log");
    Ok(log_file.to_string_lossy().to_string())
}

#[tauri::command]
fn open_log_dir(app: AppHandle) -> Result<(), String> {
    let log_dir = get_log_dir(&app);
    open_file_manager(log_dir).map_err(|e| e.to_string())
}

fn open_file_manager(path: PathBuf) -> Result<(), std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer").arg(&path).spawn()?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg(&path).spawn()?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open").arg(&path).spawn()?;
    }
    Ok(())
}

#[tauri::command]
fn save_imported_file(
    app: AppHandle,
    file_bytes: Vec<u8>,
    file_name: String,
) -> Result<String, String> {
    let imports_dir = get_app_data_dir(&app).join("imported-files");
    fs::create_dir_all(&imports_dir).map_err(|e| e.to_string())?;
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let file_path = imports_dir.join(format!("{}-{}", timestamp, file_name));
    fs::write(&file_path, &file_bytes).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn save_slide_cache(
    app: AppHandle,
    file_bytes: Vec<u8>,
    file_name: String,
) -> Result<String, String> {
    let cache_dir = get_app_data_dir(&app).join("pdf-cache");
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let file_path = cache_dir.join(format!("{}-{}", timestamp, file_name));
    fs::write(&file_path, &file_bytes).map_err(|e| e.to_string())?;
    let asset_url = format!(
        "local-asset://{}",
        file_path.to_string_lossy().replace('\\', "/")
    );
    Ok(asset_url)
}

#[tauri::command]
fn read_pdf_file(file_path: String) -> Result<Vec<u8>, String> {
    fs::read(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_imports_dir(app: AppHandle) -> Result<String, String> {
    let imports_dir = get_app_data_dir(&app).join("imported-files");
    fs::create_dir_all(&imports_dir).map_err(|e| e.to_string())?;
    Ok(imports_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn minimize_app(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn close_app(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_system_calculator() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("calc")
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-a", "Calculator"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("gnome-calculator")
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_libreoffice_path() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        let candidates = vec![
            "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
            "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
        ];
        for c in candidates {
            if fs::metadata(c).is_ok() {
                return Some(c.to_string());
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        let c = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
        if fs::metadata(c).is_ok() {
            return Some(c.to_string());
        }
    }
    #[cfg(target_os = "linux")]
    {
        let candidates = vec!["/usr/bin/libreoffice", "/usr/bin/soffice"];
        for c in candidates {
            if fs::metadata(c).is_ok() {
                return Some(c.to_string());
            }
        }
    }
    None
}

#[tauri::command]
fn convert_with_libreoffice(input_path: String, output_dir: String) -> Result<String, String> {
    let libre_path = get_libreoffice_path().ok_or("LibreOffice not found")?;

    let output = Command::new(&libre_path)
        .args([
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            &output_dir,
            &input_path,
        ])
        .output()
        .map_err(|e| format!("LibreOffice spawn failed: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "LibreOffice exited with code {:?}: {}",
            output.status.code(),
            stderr
        ));
    }

    let input_path_obj = std::path::Path::new(&input_path);
    let pdf_name = input_path_obj
        .with_extension("pdf")
        .file_name()
        .ok_or("Invalid filename")?
        .to_string_lossy()
        .to_string();
    let pdf_path = std::path::Path::new(&output_dir).join(&pdf_name);

    if fs::metadata(&pdf_path)
        .map(|m| m.len())
        .unwrap_or(0)
        == 0
    {
        return Err("LibreOffice produced no output PDF".to_string());
    }

    Ok(pdf_path.to_string_lossy().to_string())
}

#[tauri::command]
fn convert_ppt_to_pdf(input_path: String) -> Result<String, String> {
    let tmp_dir = std::env::temp_dir();
    let input_path_obj = std::path::Path::new(&input_path);
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let pdf_name = format!(
        "{}-{}.pdf",
        input_path_obj
            .file_stem()
            .ok_or("Invalid filename")?
            .to_string_lossy(),
        timestamp
    );
    let pdf_path = tmp_dir.join(&pdf_name);

    // Try PowerPoint via COM on Windows
    #[cfg(target_os = "windows")]
    {
        let ps_script = format!(
            r#"$pptPath = "{}"
$pdfPath = "{}"
try {{
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = [Microsoft.Office.Core.MsoTriState]::msoFalse
    $presentation = $ppt.Presentations.Open($pptPath, $false, $false, $false)
    $presentation.SaveAs($pdfPath, 32)
    $presentation.Close()
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
    Write-Host "SUCCESS"
}} catch {{
    Write-Error $_.Exception.Message
    exit 1
}}
"#,
            input_path.replace('\\', "\\\\"),
            pdf_path.to_string_lossy().replace('\\', "\\\\")
        );

        let script_path = tmp_dir.join(format!("convert-{}.ps1", chrono_now()));
        let _ = fs::write(&script_path, &ps_script);

        let output = Command::new("powershell")
            .args([
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                &script_path.to_string_lossy(),
            ])
            .output();

        let _ = fs::remove_file(&script_path);

        if let Ok(out) = output {
            if out.status.success() {
                if fs::metadata(&pdf_path)
                    .map(|m| m.len())
                    .unwrap_or(0)
                    > 0
                {
                    return Ok(pdf_path.to_string_lossy().to_string());
                }
            }
        }
    }

    // Fallback to LibreOffice
    if let Some(libre_path) = get_libreoffice_path() {
        let output = Command::new(&libre_path)
            .args([
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                &tmp_dir.to_string_lossy(),
                &input_path,
            ])
            .output()
            .map_err(|e| format!("LibreOffice spawn failed: {}", e))?;

        if output.status.success() {
            let lo_pdf_name = input_path_obj
                .with_extension("pdf")
                .file_name()
                .ok_or("Invalid filename")?
                .to_string_lossy()
                .to_string();
            let lo_pdf_path = tmp_dir.join(&lo_pdf_name);
            if fs::metadata(&lo_pdf_path)
                .map(|m| m.len())
                .unwrap_or(0)
                > 0
            {
                return Ok(lo_pdf_path.to_string_lossy().to_string());
            }
        }

        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("LibreOffice failed: {}", stderr));
    }

    Err(
        "Could not convert PPTX. On Windows, install PowerPoint or LibreOffice."
            .to_string(),
    )
}

#[tauri::command]
fn open_in_browser(
    app: AppHandle,
    state: tauri::State<'_, Mutex<BrowserState>>,
    url: String,
) -> Result<(), String> {
    let parsed_url = url.parse().map_err(|e| format!("Invalid URL: {}", e))?;
    let mut browser = state.lock().map_err(|e| e.to_string())?;

    // Close existing browser window if any
    if let Some(ref label) = browser.label {
        if let Some(window) = app.get_webview_window(label) {
            let _ = window.close();
        }
    }

    let label = format!("browser-{}", chrono_now());

    let window = WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(parsed_url))
        .title("Presentorbord Browser")
        .inner_size(1200.0, 800.0)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;

    let app_clone = app.clone();
    browser.label = Some(label);

    window.on_window_event(move |event| {
        if let tauri::WindowEvent::Destroyed = event {
            let _ = app_clone.emit("browser-status-changed", false);
        }
    });

    let _ = app.emit("browser-status-changed", true);

    Ok(())
}

#[tauri::command]
fn focus_internal_browser(
    app: AppHandle,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<bool, String> {
    let browser = state.lock().map_err(|e| e.to_string())?;
    if let Some(ref label) = browser.label {
        if let Some(window) = app.get_webview_window(label) {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }
    Ok(false)
}

#[tauri::command]
fn get_browser_status(
    app: AppHandle,
    state: tauri::State<'_, Mutex<BrowserState>>,
) -> Result<bool, String> {
    let browser = state.lock().map_err(|e| e.to_string())?;
    if let Some(ref label) = browser.label {
        if app.get_webview_window(label).is_some() {
            return Ok(true);
        }
    }
    Ok(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(Mutex::new(BrowserState { label: None }))
        .invoke_handler(tauri::generate_handler![
            log_message,
            get_log_path,
            open_log_dir,
            save_imported_file,
            save_slide_cache,
            read_pdf_file,
            get_imports_dir,
            minimize_app,
            close_app,
            open_system_calculator,
            get_libreoffice_path,
            convert_with_libreoffice,
            convert_ppt_to_pdf,
            open_in_browser,
            focus_internal_browser,
            get_browser_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
