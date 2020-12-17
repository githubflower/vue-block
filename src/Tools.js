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

let deepCopy = (obj) => {
    if (typeof obj !== 'object') {
        return obj;
    }

    let type = Object.prototype.toString.apply(obj);
    let ret = type === '[object Array]' ? [] : {};

    if (type === '[object Array]') {
        ret = [];
        let i = 0;
        while (i < obj.length) {
            ret[i] = deepCopy(obj[i]);
            i++;
        }
    } else {
        ret = {};
        for (let k in obj) {
            if (obj.hasOwnProperty(k)) {
                ret[k] = deepCopy(obj[k]);
            }
        }
    }

    return ret;
}
//递归根据stateId在stateAry内寻找对应的状态，根据indexFlag来决定是否返回对应状态的index
function stateTraverse(stateAry,targetStateId,indexFlag=false){
    let result = [];
    traverse(stateAry, targetStateId, result, indexFlag)
    if(indexFlag){
        return result
    } else{
        return result.pop()
    }

}
function traverse(stateAry, targetStateId, result, indexFlag){
    for (var i=0; i<stateAry.length; i++){
        if (stateAry[i].stateId === targetStateId){
            result.push(stateAry[i])
            if(indexFlag){
                result.push(i)
            }
            return
        }
        traverse(stateAry[i].children, targetStateId, result)
    }
}


export default {
    downloadFlie: downloadFlie,
    deepCopy: deepCopy,
    stateTraverse: stateTraverse,
}
