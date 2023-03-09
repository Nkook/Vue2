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
compiler 中的 1-1 ~ 1-13
如何将template模版编译成render函数：
    1. 将template转化成ast语法树（对标签名、文本、表达式、属性、字符串等编译解析成树）
        1-1. 对模版进行编译：遍历整个html，遇到开始标签解析开始标签，遇到文本解析文本，遇到结束标签解析结束标签；每解析一个就从html中移除掉，知道html为空，就结束遍历。
        1-2. 解析开始标签，通过正则匹配到后返回结果，并从html中移除该标签。拿到开始标签结果后，放入到栈中，并设置根节点及当前父节点。
        1-3. 解析到结束标签，通过正则匹配后返回结果，并从html中移除该标签。将整个标签弹出栈，并将栈中最后一个元素作为当前父节点。
        1-4. 解析到文本之后，放入当前父节点的children中，并将文本从html中移除
        1-5. 最后整个遍历完，将root返回一个树就形成了。如images中的domTree.png
    2. 生成render方法（render方法执行后的返回结果就是 虚拟DOM）



