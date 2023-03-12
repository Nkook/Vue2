// <div id="app">
//    <div>{{name}}</div>
//    <span>{{age}}</span>
// </div>
// 3. vue2采用正则 匹配标签 属性 表达式
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名<div></div>
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配到的分组是一个 标签名  <xxx 匹配到的是开始 标签的名字
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);  // 匹配的是</xxxx>  最终匹配到的分组就是结束标签的名字
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;  // 匹配属性 a = "123"
// 第一个分组就是属性的key value就是分组3/分组4/分组5
const startTagClose = /^\s*(\/?)>/;  // 匹配结束标签 </div> <br/>
// const defaultTagRE = /\{((?:.|\r?\n)+?)\}\}/g  // 匹配到的内容就是表达式的变量{{aa}}

// vue3 采用的不是使用正则

// 对模版进行编译处理
// 1-1
export function parseHTML(html) { // html最开始肯定是一个 <div   <div>hello</div>
    //  1-13 最终需要转化成一颗抽象语法树，需要构建父子关系。
    // 栈型结构，栈中的最后一个元素是当前匹配到开始标签的父亲。匹配到<div>放入栈；匹配到<div>放进栈，匹配到</div>结束标签时，再把<div>扔出去；匹配到<span>放入，匹配到</span>移除....
    const ELEMENT_TYPE = 1; // 元素类型为1
    const TEXT_TYPE = 3;    // 文本类型为3
    const stack = []; // 用于存放元素的栈
    let currentParent; // 指向的是栈中的最后一个
    let root; // 是否是根节点

    // 最终需要转化成一颗抽象语法树：一个节点包含标签名称、类型、子元素、属性、父元素
    function createASTElement(tag, attrs) {
        return {
            tag,
            type: ELEMENT_TYPE,
            children: [],
            attrs,
            parent: null
        }
    }
    //  1-11 现在只是把标签文本删掉了，并没有做任何处理替换。对这些进行处理，需要这几个方法暴漏出去，在解析到开始标签、文本、结束标签的时候进行替换。
    // 1-11-1遇到开始节点创建节点，没有根节点，就是树根；如果有父节点，那就设置为当前节点的父节点，并把当前节点作为父节点的孩子；将节点放入栈中，更更新为当前父节点
    // 利用栈型结构 来构造一颗树
    function start(tag, attrs) {
        // console.log('开始标签', tag, attrs)
        let node = createASTElement(tag, attrs) // 创造一个ast节点
        if (!root) { // 看一下是否空树，如果没有root根节点，那么这个节点就作为树的根节点
            root = node
        }
        if(currentParent){ // 如果当前父节点有值，将当前节点的父亲节点设置为currentParent
            node.parent = currentParent; // 只赋予了parent属性
            currentParent.children.push(node); // 还需要让父亲记住自己
        }
        stack.push(node) // 将节点放入栈中
        currentParent = node; // currentParent作为栈中的最后一个节点
    }
    // 1-11-2 对于文本直接放入当前父节点的子节点中
    function chars(text) { // 文本直接放到当前指向的节点中
        console.log('文本', text, text.length)
        text = text.replace(/\s/g,''); // 如果空格超过2就删除2个以上的
        text && currentParent.children.push({
            type:TEXT_TYPE,
            text,
            parent:currentParent
        });
    }
    // 1-11-3 遇到结束标签，弹出该节点，并将最后一个节点更新为当前父节点
    function end(tag) {
        // console.log('结束标签', tag)
        let node =  stack.pop();  // 遇到结束节点，弹出栈中最后一个。可以通过tag和node对比 校验标签是否合法
       currentParent = stack[stack.length - 1]; // 更新当前父节点
    }
    // 1-4 
    function advance(n) {
        html = html.substring(n) // 截取的长度就是匹配到的开始标签的长度 '<div'
    }
    // 1-3 解析开始标签 并返回匹配的结果
    function parseStartTag() {
        const start = html.match(startTagOpen) // 用html通过正则匹配看是否是开始标签
        // console.log('start', start) // ['<div', 'div', index: 0, input: '<div id="app">\n        <div>{{name}}</div>\n        <span>{{age}}</span>\n    </div>', groups: undefined]
        if (start) { // 如果匹配到了就是开始标签：把结果组成一个对象，把标签名、对应的属性放进去
            const match = {
                tagName: start[1], // 标签名
                attrs: [] // 属性
            }
            // console.log(match) // {tagName: 'div', attrs: Array(0)}
            // 1-4 需要对html不停的解析，已经解析过的要删除掉。比如，解析了开始标签，把<div>删除掉，再解析 id='app'属性。所以要有个删除的过程，写个方法，叫前进，前进长度就是匹配到的内容的总长度
            advance(start[0].length);
            // console.log(start[0], html) // 打印可以看到匹配一段就少一段 <div   id="app"><div>{{name}}</div><span>{{age}}</span></div>
            
            // 1-5 匹配属性：只要不是开始标签的结束!html.match(startTagClose，就一直匹配下去；拿到每次匹配的属性html.match(attribute)放到数组attr中。删除掉匹配的属性
            let attr, end
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length); // id="app"就删掉了
                // 1-6 需要把属性解析出来放到attrs属性中去
                match.attrs.push({ name: attr[1], value: attr[3] || attr[4] || attr[5] || true })
            }
            // 也应该把结束标签>删掉, 如果end有值就删除
            if (end) {
                advance(end[0].length);
            }
            return match
            // 1-6
            // console.log(match) // {tagName: 'div', attrs: [{name: 'id', value: 'app'}]}
        }

        // 否则不是开始标签
        return false
    }
    // debugger 可以看整个过程
    // 1-2 整个过程：遇到开始标签解析开始标签，遇到文本解析文本，遇到结束标签解析结束标签
    while(html) { // 每解析一个标签就把它从这个字符串中删除掉，整个模版字符串都没有了就解析完了 // while : 在…. 期间， 所以 while循环 就是在满足条件期间，重复执行某些代码。 continue：结束本次循环，继续下次循环。break：跳出所在的循环
        // 如果textEnd 为0 说明是一个开始标签或者结束标签 如： <div>hello</div>
        // 如果textEnd > 0说明就是文本的结束位置
        let textEnd = html.indexOf('<') // 如果indexof中的索引是0 则说明是个标签
        // 1-2 解析标签
        if (textEnd == 0) {
            // 1-3
            const startTagMatch = parseStartTag() // 解析开始标签 // 开始标签的匹配结果: 先匹配开始标签，再匹配属性，再匹配结束标签；并把已经匹配到的从html模版字符中删除掉；返回匹配到的结果对象{tagName: 标签名, attrs: 属性}
            // 1-7 如果是【开始标签】有值，跳过本轮操作，继续再往下走
            if (startTagMatch) { // 解析到的开始标签
                // 1-12
                start(startTagMatch.tagName, startTagMatch.attrs)
                // console.log(html) // 这个时候看到还是开始标签 <div>{{name}}</div><span>{{age}}</span></div>
                continue // 为啥跳出本次循环，因为开始标签移除后，再重新循环html去找结束标签就好了。下面的代码就不再走了，如果不写，就走到下面解析文本了
            }
            
            // 1-9 如果不是开始标签，就是【结束标签】。匹配到后直接删除
            let endTagMatch = html.match(endTag); // 通过正则匹配结束标签，返回当前结束标签的名字
            if (endTagMatch) { // 如果有值就删除掉
                advance(endTagMatch[0].length);
                // 1-12
                end(endTagMatch[1])
                continue;
            }
        }
        // 1-8 解析【文本】内容
        if (textEnd > 0) {
            let text = html.substring(0, textEnd); // 文本内容
            if (text) {
                // 1-12
                chars(text)
                advance(text.length); // 解析到的文本 
            }
        }
    }
    console.log('root', root)
    return root
    // console.log(html, '====')
}