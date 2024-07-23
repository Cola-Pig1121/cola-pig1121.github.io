const fs = require('fs');

function 递归遍历文件夹(folderPath) {
	fs.readdir(folderPath, (err, files) => {
		if (err) throw err;

		files.forEach(file => {
			const currentPath = `${folderPath}/${file}`;
			fs lstat(currentPath, (err, stats) => {
				if (err) throw err;

				if (stats.isDirectory()) {
					// 如果是目录，则继续递归
					递归遍历文件夹(currentPath);
				} else {
					// 如果是文件，则打印文件路径
          document.getElementById("img").innerHTML = currentPath；
				}
			});
		});
	});
}

递归遍历文件夹(./image);
