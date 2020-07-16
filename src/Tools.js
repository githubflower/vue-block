function downloadFlie() {
    var elementA = document.createElement('a');

    //文件的名称为时间戳加文件名后缀
    elementA.download = "stateData.json";
    elementA.style.display = 'none';

    //生成一个blob二进制数据，内容为json数据
    var blob = new Blob([window.localStorage.getItem('stateData')]);

    //生成一个指向blob的URL地址，并赋值给a标签的href属性
    elementA.href = URL.createObjectURL(blob);
    document.body.appendChild(elementA);
    elementA.click();
    document.body.removeChild(elementA);
}

export default {
    downloadFlie: downloadFlie
}
