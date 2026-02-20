import fs from 'fs'
import pngToIco from 'png-to-ico'

pngToIco('src/assets/presentor.png')
    .then(buf => {
        fs.writeFileSync('build/icon.ico', buf)
        console.log('Icon converted successfully!')
    })
    .catch(err => {
        console.error('Failed to convert icon', err)
    })
