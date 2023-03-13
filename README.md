# Vue2
Vue2源码学习
一、搭建环境
    1. npm init -y 初始化 生成package.json,记住开发相关的依赖
    2. npm install rollup  rollup打包工具，类库打包全部采用这个，打包的体积会比webpack小很多，会更专注一些，主要的目的就是打包js库
    3. npm install rollup rollup-plugin-babel @babel/core @babel/preset-env --save-dev 
    rollup需要配合babel使用，安装rollup-plugin-babel插件，需要用到核心模块@babel/core，这个模块通过@babel/preset-env把高级语法转成低级语法。 --save-dev是只在开发的时候使用
    这是常用的4个包。

    4. rollup.config.js 建一个rollup配置文件 配置入口出口文件配置插件plugins
    5. .babelrc 新建文件 添加一些预设的babel 在plugins中使用
    5. package.json中"dev": "rollup -cw", 通过npm run dev 打包出来dist文件夹
    6. 在dist文件里新建index.html并把打包出来的vue.js引入进去，打印Vue会看到一个Object对象，里面有src/index.js的变量
        在控制台直接打印Vue,可以看到变量都挂载在Vue变量上。

二、new Vue
    1. new Vue创建一个实例对象vm，传参是个对象
    2. 创建Vue构造函数，构造函数上有init初始化方法
    3. 初始化方法挂载在Vue的原型对象prototype上，如果都一个个挂载看起来很多。将一个个方法封装成函数，将_init方法封装成initMixin方法导入
    4. initMixin方法中是挂载在原型对象上的_init方法，将用户的选项挂载到实例上
    5. initState初始化状态，判断传入的选项中是否有data，
    6. 有data再initData初始化数据，判断data是函数还是对象，赋值

三、实现对象的响应式原理
5-1～5-8
循环对象，用Object.defineProperty给对象的属性重新定义，如果值还是对象，需要对值进行递归操作，这样就可以对每一个属性值的变化（取值、修改值）进行监控。
如果修改vm的属性值为一个对象，则需要在set操作里对新的属性值进行observe数据劫持。
对象被劫持完后，为了方便用户获取，就把这个data放在了vm上（vm._data = data），这样写比较麻烦。当去vm取值的时候，通过代理就去_data取值。
 
四、实现数组的函数劫持
6-1～6-6
重写数组的方法，并且去观测数组中的每一项，如果是数组的话，需要去针对数组新增的属性去做判断，并且把新增的每一项再去做观测。

五、
7-1~7-2
上面首先把状态initState初始化完成了，
看是否有el模版，将其挂载到vm实例上；
写挂载方法，判断如果没有render需要去拿到el模版转成render，如果有render直接赋值给vm.$options。
compiler 中parse.js的 1-1 ~ 1-13  index.js中的2-1 ～ 2-7
如何将template模版编译成render函数：
    1. 将template转化成ast语法树（对标签名、文本、表达式、属性、字符串等编译解析成树）
        1-1. 对模版进行编译：遍历整个html，遇到开始标签解析开始标签，遇到文本解析文本，遇到结束标签解析结束标签；每解析一个就从html中移除掉，知道html为空，就结束遍历。
        1-2. 解析开始标签，通过正则匹配到后返回结果，并从html中移除该标签。拿到开始标签结果后，放入到栈中，并设置根节点及当前父节点。
        1-3. 解析到结束标签，通过正则匹配后返回结果，并从html中移除该标签。将整个标签弹出栈，并将栈中最后一个元素作为当前父节点。
        1-4. 解析到文本之后，放入当前父节点的children中，并将文本从html中移除
        1-5. 最后整个遍历完，将root返回一个树就形成了。如images中的domTree.png
    2. 将语法树 转成render方法（render方法执行后的返回结果就是 虚拟DOM）
        2-1. render函数的返回值拼接 return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))
        2-2. ast语法树中有tag标签，有标签绑定的attrs属性，有其children子节点，有text文本
        2-3. 将以上这几种分情况处理 拼接成render的返回值
        2-4. 先拼接tag标签，再拼接该标签的属性，再拼接该节点的孩子
            2-4-1. _c创建元素， _v创建文本， _s是变量转成字符串
            2-4-2. 拼接属性：遍历当前节点属性attrs是个数组，把每一项通过字符串进行拼接；遇到style需要用大括号{style:{color:'red'}}。
                将[{name: 'id', value: 'app'}] 转成 {id:"app"}；
                将[{name: "style", value: {color: 'red', background: 'pink', "": undefined}}]转成{style:{"color":" red","background":" pink"}}
            2-4-3. 拼接节点的孩子：遍历每一项，gen方法进行处理通过join拼接。
                    对每一项处理
                    如果是文本创建文本，如果是标签创建标签
                    过程：1）先判断是文本还是标签，如果是标签调用codegen方法，拼接tag标签，再拼接该标签的属性，再拼接该节点的孩子
                         2）如果是文本，分为纯文本和含有{{变量}}的文本; 
                            2.1）通过正则匹配该文本中是否含有变量，如果没有，直接转成字符串拼接；
                            2.2) 如果存在有变量，分三种情况处理。循环该文本正则匹配到值，并依次放入数组中tokens
                                    如果匹配到的变量索引 > 最后一个索引值(默认0)，说明两个变量中间存在纯文本，需要通过slice截取出来放入tokens中
                                    如果最后索引值 < text整个文本的总长度，说明后面还有纯文本，通过slice截取后面的字符放入tokens中

        2-5. 以上4步拼接好了字符串，也就是render函数的返回值。根据字符串生成render函数，并返回render函数。
        2-6. 将render函数赋值到 实例的选项vm.$options上

六、实现虚拟dom转真实dom
    1. 在初始化init.js中 初步渲染mountComponent，调用render方法
        把当前的vm实例上的render调用一下，产生虚拟dom，再把虚拟dom渲染到el元素(#app)中去
    2. 进入lifecycle.js，vm._update(vm._render())
        1. 调用render方法产生虚拟节点 虚拟DOM
            1.1 vm._render()函数执行完成后返回虚拟dom
            1.2 执行_render函数会报错因为里面的_v,_c,_s方法都未定义，需要定义。
            1.3 _c创建元素节点方法，_v创建文本节点，_s是变量转成字符串
                1.3.1 创建元素虚拟节点，返回vnode(vm, tag, key, data, children); // 虚拟节点上有vm实例，标签，key，属性，孩子
                1.3.2 创建文本虚拟节点，返回vnode(vm, undefined, undefined, undefined, undefined, text);
                1.3.3 虚拟节点一共有这几项：vnode(vm, tag, key, data, children, text)
                1.3.4 执行完后返回整个虚拟dom

        2. 根据虚拟DOM产生真实DOM 
            2.1 vm._update()方法是把虚拟节点变成真实节点
            2.2 用虚拟vnode dom，创建真实的dom，替换掉原来的el。vm.$el = patch(el,vnode);
            2.3 patch方法：既有渲染又有更新：更新传老的虚拟节点，同时传入新的节点
                2.3.1 如果有真实节点，拿到真实节点的父元素，
                2.3.2 根据虚拟节点创建createElm新的真节点
                    2.3.2.1 新节点创建：创建标签，更新标签的属性，创建文本，创建标签的子节点。
                2.3.3 创建好newElm新节点，将新节点插入到原来老节点的后面，再删掉原来的老节点
            2.4 将新节点返回出去

        3. 插入到el元素中
            vm.$el = patch(el,vnode); // 用vnode创建真实的dom，替换掉原来的el
    
    
    
    


