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

 


