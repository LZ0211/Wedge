var Editor = function (UI){
    this.UI = UI;
}

Editor.fn = Editor.prototype;

Editor.fn.replace = function (string,sOrg,sRep,isReg){
    if (!isReg){
        string = string.replace(eval(sOrg),sRep);
    }
    else {
        while (string.match(sOrg)){
            string = string.replace(sOrg,sRep);
        }
    }
    return string;
}