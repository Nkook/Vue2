// 将html转成ast语法树
import { parseHTML } from "./parse";

// 2-6
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{ asdsadsa }}  匹配到的内容就是我们表达式的变量

// 2-2 遍历当前节点属性，把每一项通过字符串进行拼接；遇到style需要用大括号{style:{color:'red'}}
function genProps(attrs) {
    //attrs属性在ast树上是个数组[{name: 'style', value: 'color: red; background: pink;'}]
    // 转成 {style:{"color":" red","background":" pink"}}
    let str = ''// {name: value}
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') {
            // color:red;background:red => {color:'red', background:'red'}
            let obj = {};
            attr.value.split(';').forEach(item => { // 先通过分号分割成数组，再循环组成对象
                let [key, value] = item.split(':');
                obj[key] = value;
            });
            attr.value = obj
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},` // [{name: 'id', value: 'app'}] 转成 {id:"app"}
    }
    return `{${str.slice(0, -1)}}` // 去除最后一个字符逗号
}
// 2-5 如果是文本创建文本，如果是标签创建标签
// _c创建元素， _v创建文本， _s是变量转成字符串
// 过程：1）先判断是文本还是标签，如果是标签调用codegen方法，拼接tag标签，再拼接该标签的属性，再拼接该节点的孩子
//      2）如果是文本，分为纯文本和含有{{变量}}的文本; 
//          2.1）通过正则匹配该文本中是否含有变量，如果没有，直接转成字符串拼接；
//          2.2) 如果存在有变量，分三种情况处理。循环该文本正则匹配到值，并依次放入数组中tokens
//                  如果匹配到的变量索引 > 最后一个索引值(默认0)，说明两个变量中间存在纯文本，需要通过slice截取出来放入tokens中
//                  如果匹配到的变量索引为0，将匹配到的变量直接放入tokens中，并将最后索引值更新为 = 当前变量的索引值+当前变量的长度
//                  如果最后索引值 < text整个文本的总长度，说明后面还有纯文本，通过slice截取后面的字符放入tokens中
function gen(node) {
    console.log('node', node)
    if (node.type === 1) { // 标签，需要调用方法 去 拼接tag标签，再拼接该标签的属性，再拼接节点的孩子
        return codegen(node);
    } else { // 纯文本，需要分两种情况 {{name}}hello   呵呵
        let text = node.text  
        if (!defaultTagRE.test(text)) { // 是否是纯文本，如果是文本 什么都不用做，直接返回这个纯文本字符。defaultTagRE.test('hello') == false   defaultTagRE.test('{{name}}hello') == true
            return `_v(${JSON.stringify(text)})`
        } else {
            //_v( _s(name)+'hello' + _s(age))
            let tokens = [];
            let match; // 匹配到的文本
            defaultTagRE.lastIndex = 0; // 正则里面含有/g的话，exec每次用过之后需要重置位置，否则只能被捕获到一次
            let lastIndex = 0;
            // split
            while (match = defaultTagRE.exec(text)) { // 通过正则匹配到有变量的文本赋值给match。 这里的text是{{name}}hello{{age}}
                console.log('match', match) //  ['{{name}}', 'name', index: 0, input: '{{name}}hello{{age}}', groups: undefined]  ['{{age}}', 'age', index: 13, input: '{{name}}hello{{age}}', groups: undefined]
                let index = match.index; // 匹配变量的位置: 比如第一个{{name}}位置是0，第二个{{age}}是13。 {{name}} hello {{age}} hello
                if (index > lastIndex) { // 匹配的第二个变量的位置比上一次更新的位置大的话，说明两个变量之间存在文本，需要把文本放进去。
                    tokens.push(JSON.stringify(text.slice(lastIndex, index))) // 截取 最后一次位置到当前第二个变量的位置就是中 纯文本
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index + match[0].length // lastIndex等于当前匹配的位置加上当前匹配到变量的长度，就是整个文本最后一次的位置。 {{name}} hello {{age}}第一次index是0，长度是{{name}}8，最后一次位置更新为8
            }
            if (lastIndex < text.length) { // 最后匹配的位置小余整个文本的长度，需要把后面的纯文本放入
                tokens.push(JSON.stringify(text.slice(lastIndex)))
            }
            console.log('tokens', tokens) //  ['_s(name)', '"hello"', '_s(age)']
            return `_v(${tokens.join('+')})`
        }
    }
}
// 2-4 遍历子节点 
function genChildren(children) {
    return children.map(child => gen(child)).join(',')
}
// 2-1
function codegen(ast) {
    // 2-3 拼接子节点
    let children = genChildren(ast.children);
    // 2-1拼接tag标签，再拼接该标签的属性，再拼接节点的孩子
    // _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))
    let code = (`_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'
        }${ast.children.length ? `,${children}` : ''
        })`)

    return code;
}


export function compileToFunction(template) {
    // 1. 将template转化成ast语法树（模版针对的就是上面的内容：对于标签解析的是标签名、文本、表达式、属性、字符串等）
    let ast = parseHTML(template)
    console.log(ast)
    // 2. 将语法树 转成render方法（render方法执行后的返回结果就是 虚拟DOM）
    // 2-1 
    let code = codegen(ast) // 拿到的是字符串，想让字符串运行
    // console.log('code', code) //  _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))

    // 2-7 模板引擎的实现原理 就是 with  + new Function
    code = `with(this){return ${code}}` // 将编译后的结果包装成with。with为了取值方便，this是谁就从谁身上取值。对象属性直接变成了with作用域下的
    let render = new Function(code) // 根据字符串生成render函数
    
    // console.log(render.toString()) 打印结果如下
    // function anonymous(
    //     ) {
    //     with(this){return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))}
    //     }
    // 通过call改变this指向vm
    // render.call(vm)

    return render

    // 生成一个函数，叫render函数，参数h，里面需要创建个div，div有自己的属性；还有自己的儿子及其属性；还有个表达式文本内容，表达式可能是对象，先JSON.stringify转成字符串
    // 创建一个元素_c，
    // 元素有个儿子叫div,属性叫id: app；有一个儿子叫div属性叫style:{color: 'red'}；儿子里面放的是个变量可能是字符串，先JSON.stringify转正字符串，再拼接hello
    // 还有一个儿子叫span，没有属性，有个变量叫age
    // 实现_c  _v  _s方法就可以了。最终把ast树组装成下面这样的语法就结束了
    // 先不考虑render函数，可以通过new Function 生成函数，先考虑这个返回值。
    // render() {
    //     return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))
    // }
    
}

// let obj = {}
// with(obj) {
//     console.log(this.a) // 这里的this就是obj,使用with时，里面的取值都会从obj上取
// }

// ast树
// {tag: 'div', type: 1, children: Array(2), attrs: Array(1), parent: null}
//     attrs: Array(1)
//         0: {name: 'id', value: 'app'}
//         length: 1
//         [[Prototype]]: Array(0)
//     children: Array(2)
//         0: {tag: 'div', type: 1, children: Array(1), attrs: Array(1), parent: {…}}
//         1: {tag: 'span', type: 1, children: Array(1), attrs: Array(0), parent: {…}}
//         length: 2
//         [[Prototype]]: Array(0)
//     parent: null
//     tag: "div"
//     type: 1
//     [[Prototype]]: Object

// children
// children: Array(2)
//     0:
//         attrs: Array(1)
//             0:
//                 name: "style"
//                 value: {color: ' red', background: ' pink', "": undefined}
//                 [[Prototype]]: Object
//                 length: 1
//                 [[Prototype]]: Array(0)
//         children: Array(1)
//             0: {type: 3, text: '{{name}}hello{{age}}', parent: {…}}
//             length: 1
//             [[Prototype]]: Array(0)
//         parent: {tag: 'div', type: 1, children: Array(2), attrs: Array(1), parent: null}
//         tag: "div"
//         type: 1
//         [[Prototype]]: Object
//     1: {tag: 'span', type: 1, children: Array(1), attrs: Array(0), parent: {…}}
//     length: 2
//     [[Prototype]]: Array(0)
//     parent: null
//     tag: "div"
//     type: 1
//     [[Prototype]]: Object