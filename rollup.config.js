// 1. 指定打包入口文件：新建src/index.js
// 2. 和出口文件: 打包后这个文件放在哪里
// 3. 打包后可以通过一个html文件在浏览器中打开引用
// 4. 配置插件
// 5. 使用import和export default打包报错：https://blog.csdn.net/qq_38800316/article/details/127496678


// import babel from 'rollup-plugin-babel'
const babel = require('rollup-plugin-babel')

// rollup默认可以导出一个对象作为打包的配置文件
// export default {
module.exports = {
    input: './src/index.js',
    output: {
        file: './dist/vue.js',
        name: 'Vue', // 打包后在全局global上增加一个属性叫Vue
        format: 'umd', // 打包的格式：常见的有 esm es6模块 commonjs模块 iife自执行函数 umd（commonjs amd）
        sourcemap: true, // 可以调试源代码
    },
    // 所有的插件都是函数
    plugins: [
        babel({ // 可以放置babel的选项：一般用babel，都会建一个babel的配置文件.babelrc，也可以在函数里直接去写。
            exclude: 'node_modules/**' // 排除node_modules下的所有文件 **代表所有的文件
        })
    ]
}