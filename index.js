const express = require('express')
const fs = require('fs')
const dayjs = require('dayjs')
const { v4 } = require('uuid')
const path = require('path');
const uuid = v4
const { createCanvas, loadImage, registerFont } = require('canvas')
registerFont('./font/MiSans.ttf', { family: 'MiSans' })
if (!fs.existsSync('./out')) fs.mkdirSync('./out');
const app = express()
const port = 3000

const dayStr = { 
  0: '星期日',
  1: '星期一',
  2: '星期二', 
  3: '星期三', 
  4: '星期四',
  5: '星期五',
  6: '星期六'
}

function saveBuffer(name, dataBuffer) {
  fs.writeFile('./out/' + name, dataBuffer, function (err) {
    err && console.log(err);
  })
};

app.get('/addWatermark', async ({ query }, res) => {
  try {

    const { time, text, url } = query
    const dayjsObj = dayjs(new Date(Number(time)))
    const date = dayjsObj.format('YYYY-MM-DD')
    const clock = dayjsObj.format('HH:mm')
    const day = dayStr[dayjsObj.day()]
    const image = await loadImage(url)
    const width = image.width
    const height = image.height
    const vmin = Math.min(width, height)
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const size1 = vmin * 0.1
    const size2 = vmin * 0.03
    const size3 = vmin * 0.015
    const size4 = vmin * 0.005
    const fileName = uuid() + '.png'

    // 通用配置
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    const margin = vmin * 0.015

    // 背景原图
    ctx.drawImage(image, 0, 0, width, height)

    // 额外文字
    ctx.font = size2 + 'px MiSans'
    ctx.fillText(text, margin, height - size2 - margin, width - margin * 2)

    // 时间
    ctx.font = size1 + 'px MiSans'
    ctx.fillText(clock, margin, height - size2 - size3 - size1 - margin - size4)

    // 时间日期分割线
    ctx.fillStyle = '#f1cc48'
    const clockWidth = ctx.measureText(clock).width
    ctx.rect(margin + clockWidth + size3, height - size2 - size1 - margin, size4, size1 - size4)
    ctx.fill()
    ctx.fillStyle = '#ffffff'

    // 日期
    ctx.font = size2 + 'px MiSans'
    ctx.fillText(date, margin + clockWidth + size3 + size4 + size3, height - size2 - size3 - size1 - margin + size3 + size4)

    // 星期
    ctx.fillText(day, margin + clockWidth + size3 + size4 + size3, height - size2 - size3 - margin - size2 - size4 - size4)

    // 保存并返回文件名
    saveBuffer(fileName, canvas.toBuffer())
    res.send({ fileName, 'suc': true })

  } catch (e) {
    console.log(e);
    res.send({ 'suc': false })
  }
})


// 启动显示端口
app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})

// 向外暴露out文件夹
app.use('/out', express.static('./out'));

// 跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, PUT, DELETE')
  res.header('Allow', 'GET, POST, PATCH, OPTIONS, PUT, DELETE')
  next();
});


function deleteImage24hAgo() {
  const folderPath = './out';
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;
  fs.readdir(folderPath, (err, files) => {
    files.forEach(file => {
      const filePath = path.join(folderPath, file);
      fs.stat(filePath, (err, stats) => {
        if ((now - stats.mtimeMs) > hours24) {
          fs.unlink(filePath, (err) => {
            console.log(`文件已删除: ${filePath}`);
          });
        }
      });
    });
  });
}

setInterval(deleteImage24hAgo, 60 * 60 * 1000)
deleteImage24hAgo()