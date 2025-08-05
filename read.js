// node fs模块
const fs = require('fs');
// node path模块
const path = require('path');
// 收集所有的文件路径
const arr = [];
let timer = null;
const fileDisplay = (url, cb) => {
	const filePath = path.resolve(url);
	//根据文件路径读取文件，返回文件列表
	fs.readdir(filePath, (err, files) => {
		if (err) return console.error('Error:(spec)', err)
		files.forEach((filename) => {
			//获取当前文件的绝对路径
			const filedir = path.join(filePath, filename);
			// fs.stat(path)执行后，会将stats类的实例返回给其回调函数。
			fs.stat(filedir, (eror, stats) => {
				if (eror) return console.error('Error:(spec)', err);
				// 是否是文件
				const isFile = stats.isFile();
				// 是否是文件夹
				const isDir = stats.isDirectory();
				if (isFile) {
					// 这块我自己处理了多余的绝对路径，第一个 replace 是替换掉那个路径，第二个是所有满足\\的直接替换掉
					arr.push(filedir.replace(__dirname, '').replace(/\\/img, ''))
					// 最后打印的就是完整的文件路径了
					if (timer) clearTimeout(timer)
					timer = setTimeout(() => cb && cb(arr), 200)
				}
				// 如果是文件夹
				if (isDir) fileDisplay(filedir, cb);
			})
		});
	});
}

// 在index.html中插入icas组件相关文件
const injectToHtml = (ar) => {
	const { EOL } = require("os");
	const html = "./img.html";
	const source = fs.readFileSync(html, "utf8");
	// if (source.indexOf("web-icas") > -1) return;  若已注入则跳过
	const data = source.split(/\r?\n/gm);
	// head末尾插入资源
	data.splice(
	  data.findIndex((c) => c.trim() === "</head>"),
	  null,
	  `  <link rel="preload" href=".`,ar,`" as="image"> `
	);
	// body末尾插入组件
	data.splice(
		data.findIndex((c) => c.trim() === "<span></span>"),
		null,
		` <a href=".`,ar,`"><img id="preloadedImage" src=".`,ar,`" style="width: 150px; height: 150px; object-fit: cover; object-position: top;" > </a> `
	);
	fs.writeFileSync(html, data.join(EOL));
};



// 测试代码
fileDisplay('./image', (arr) => {
	for (let i = 0; i < arr.length; i++){
		injectToHtml(arr[i]);
	}
		
})

// commonjs规范
module.exports = fileDisplay;
module.exports = injectToHtml;

