const path = require('path')
const fs = require('fs');
const urlencode = require('urlencode')

const projectManage = {
	newProject(req, res){
		
	},
	saveProject(req, res) {
		console.log('---saveProject---');
		//targetPath, filename, 
		// let stateData = path.join(__dirname, '/stateData.json');
		// let blocklyData = path.join(__dirname, '/blocklyData.xml');

		let msg = [];
		if (Object.prototype.toString.call(req.body.codeAry) === "[object Array]") {
			let codeAry = req.body.codeAry;
			let threadsData = req.body.threadsData;
			codeAry.forEach((item, index) => {
				fs.writeFile(urlencode(threadsData[index].basicData.name).replace(/%/g, '_') + '.ql', item, (err) => {
					if (err) {
						return console.log(err)
					} else {
						msg.push(urlencode(threadsData[index].basicData.name).replace(/%/g, '_') + ' created success!');
					}
				});
			})
		}
		res.send({
			code: 200,
			msg: msg
		});
		/*readFileToArr(targetPath + 'main.ql', (bpData) => {
		  fs.writeFile(targetPath + 'lineAndId.json', JSON.stringify(bpData), err => {
		    if (err) {
		      return console.log(err);
		    }
		  });
		  msg.push("create lineAndId.json Success");
		  console.log('create lineAndId.json success!');
		})*/
	},
	loadProject(req, res) {
		let thePath = req.body.path || path.join(__dirname);

		console.log('req.body.path: ' + req.body.path);
		console.log('path: ' + thePath);
		res.send({
			code: 200,
			data: projectManage.readDir(thePath),
			msg: 'load dir success!'
		})
	},
	/**
	 * [readDir 递归读取指定路径下的文件和目录]
	 * @param  {[str]} path1 [description]
	 * @return {[Array]}       [树形结构的array]
	 */
	readDir(path1) {
		let ary = [];
		const dirInfo = fs.readdirSync(path1);
		dirInfo.forEach(item => {
			const path2 = path.join(path1, item);
			const info = fs.statSync(path2);
			if (info.isDirectory()) {
				ary.push({
					label: item,
					isLeaf: false,
					children: this.readDir(path2)
				});
			} else {
				ary.push({
					label: item,
					isLeaf: true
				});
			}
		})
		return ary;
	}
}
module.exports = projectManage;