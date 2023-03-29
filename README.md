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

五、将template转化成ast语法树; 将语法树 转成render方法; render方法执行后的返回结果就是 虚拟DOM
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
    

中间总结：1. 在vue渲染中会将data中的数据变成响应式的数据，调用initState，针对对象会对所有的属性进行Object.defineProperty增加get和set，还会针对数组重写数组方法。
        2. template模板编译，将模板先转换成ast语法树，通过正则匹配标签，解析属性，标签名，文本；将ast语法树生成render方法（会把html模板转成js语法），调用render可以创建虚拟dom
        3. 调用render函数会进行取值操作 render(){_c('div', null, _v(name))}，产生对应的虚拟dom。取值会触发get方法
        4. vm._update()将虚拟dom渲染成真实dom，根据数据创建一个最新的虚拟dom。
        // _render()函数根据数据创建最新的虚拟DOM节点（使用响应式数据）
        // _update()根据生成的虚拟节点创造真实的DOM,重新渲染    

现在的更新是比较暴力的，数据变了之后，用户需要手动调用更新渲染方法。
期望数据变化后，可以自己重新渲染。

七、模板中数据的依赖收集：模板中使用了name和age，如果name和age更新了，视图就自动渲染。
    思路：
        1. 在模板里使用到了name数据，当name更新了，就需要重新渲染模板。（dist/3.index.html 中的手动调用vm._update(vm._render())）这样的更新是比较暴力的，数据变了之后，用户需要手动调用更新渲染方法。

        期望数据变化后，可以自己重新渲染。
        2. 首先要知道模板中用到了哪些属性，我们可以给模板中的属性，每个都增加一个收集器 dep。这个dep中会存着vm._update(vm._render())这个渲染逻辑。假如name变化了，就去执行name的dep，去重新走渲染逻辑。

        3.页面渲染的时候 我们将渲染逻辑vm._update(vm._render()) 封装到watcher中; 让dep记住这个watcher即可， 稍后属性变化了可以找到属性对应的dep中存放的watcher进行重新渲染

    步骤：
        1. 新建一个watcher类watcher.js，将vm._update(vm._render())封装进去
            1-1. 会有多个组件使用同一个属性，一个组件的属性变了，其它组件是不需要变的。那么就需要每次创建一个watcher都给一个唯一的id。不同的组件有不同的watcher，每个组件都会去new这 个watcher。然后调用vm._update(vm._render())进行取值渲染。
            1-2. 需要给每个属性增加dep为了收集watcher，dep增加个变量叫target暴漏在全局上。
                 默认在需要渲染的时候会new创建一个watcher，并把当前的watcher赋值给全局变量Dep.target上，之后页面vm._render()的时候会对属性进行取值，会走get()方法，取值的时候判断Dep.target有值，就让当前属性的dep记住这个渲染watcher，就把这个watcher收集起来放入到subs栈中。这样当前属性的dep就和每个watcher关联起来了。视图渲染完成后要清空Dep.target。
                【只会对用到的属性进行依赖收集，用不到就不收集。
                  只有在模板里用到的属性才会做依赖收集。
                  首页渲染会收集，再次更新还会收集。】
            1-3. 如果页面上同一个属性用了两次，那么取值两次的话，会对这个属性进行重复收集。同一个dep里收集两个相同的watcher是不行的。
                对watcher进行去重。并且，dep收集watcher的同时，让watcher也记录dep。他俩是多对多的关系
                让watcher也记录dep，双向记录收集是为了：如组件卸载的时候，让watcher清理掉所有的响应式数据。
                1）当取值的时候调用depend()，addDep()将当前属性的dep传入，在watcher里收集dep，会让watcher记住dep，
                2）同时，addSub()将当前watcher传入，告诉dep也记住watcher。同时进行了去重。
                    （去重：那个new Dep不在get方法里，所以每个属性只会有一个dep id，每次触发get的时候去进行watcher收集了。为了避免多次get收集重复的watcher所以就拿这个属性的id进行去重！）

            1-4. 更新属性的时候，就会走到index.js中的set方法。让该属性的dep去更新视图。
                 调用update，再去走get()vm._update(vm._render())进行更新渲染

            1-5. npm run dev 打包后看3.index.html，过1秒后页面数据更新成jw 30

        总结：实现vue中的依赖收集：页面初始化的时候给每个属性增加dep，new Dep会给该属性分配一个唯一id，页面渲染时会创建一个watcher，将渲染和更新vm._update(vm._render())逻辑放入watcher类中，此时渲染时会去取值，并把当前的watcher给到dep.target全局变量上，此时取值会进行判断，如果该属性的dep上target有值，则调用方法，将当前watcher收集到该属性的dep中，并将该属性的dep收集到该watcher中，并通过id进行去重。此时当更新属性时，需要去调用dep中的update更新相当于再次重新渲染，会对dep中收集的所有watcher遍历一一进行更新。

八、异步更新原理
    1. 一个模板属性多次被赋值，只执行一次watcher
        1). 每次vm.name = ''给属性赋值，都会触发set方法，去调用dep里的notify，遍历调用该属性收集的所有watcher。
        2). 一个页面模板是一个watcher，修改多个属性时，会去触发多次watcher并且是重复的，需要对watcher进行去重，调用queueWatcher。
            通过id进行去重，并把去重后的watcher放入一个队列中，利用防抖，等到所有的赋值同步都走完之后再去执行队列中的watcher，进行页面刷新。此时一个页面无论同时修改多少个属性，wathcer只会执行一次。

    2. $nextTick 异步批处理
        1). 在html中手动对vm.name = '李四'进行赋值，此时去app.innerHTML获取页面上的name这个值，获取到的不是最新的值。因为set赋值后，页面的更新操作相关逻辑是放在queueWatcher()方法的setTimeout异步里进行调用的。
        2). 此时就需要用到nextTick，将一些任务维护到一个队列中，通过防抖，最后一起刷新，循环该队列依次执行。
            直接在setTimeout里进行异步批处理的话，此时app.innerHTML获取页面是最新的值。因为这个宏任务是在更新的宏任务之后。
            去掉setTimeout，直接打印vm.name是最新的值，获取页面不是最新的值，因为微任务优先于宏任务执行，虽然赋值是同步的，但是页面渲染在异步里。
                vue2是使用优雅降级的方式，兼容低版本的浏览器，去进行任务队列的执行。
                vue3直接采用Promise.resolve().then()去执行任务队列

九、数组更新实现原理
        1. 上面只对属性进行了依赖收集，并没有对数组、对象进行依赖收集，所以当修改数组及对象时不能实现页面数据更新
        2. 在observe监听时，给每个对象都增加收集功能this.dep = new Dep()
        3. 在数据劫持的时候，对这个对象的dep进行依赖收集
        4. 如果数组里嵌套数组，依旧对嵌套的数组进行依赖收集，通过递归去进行。
        5. 在array.js中进行ob.dep.notify()更新渲染




 
    

最后总结：
    1. 在vue渲染中会将data中的数据变成响应式的数据，调用initState，针对对象会对所有的属性进行Object.defineProperty增加get和set，还会针对数组重写数组方法。
    2. template模板编译，将模板先转换成ast语法树，通过正则匹配标签，解析属性，标签名，文本；将ast语法树生成render方法（会把html模板转成js语法），调用render可以创建虚拟dom
    3. 调用render函数会进行取值操作 render(){_c('div', null, _v(name))}，产生对应的虚拟dom。取值会触发get方法
    4. vm._update()将虚拟dom渲染成真实dom。
    // _render()函数根据数据创建最新的虚拟DOM节点（使用响应式数据）
    // _update()根据生成的虚拟节点创造真实的DOM,重新渲染    
    5. 数据变化自动更新视图(模板中数据的依赖收集)：
        5.1 需要再次调用vm._update(vm._render())。将渲染逻辑封装到一个watcher类中，页面初始化时会进行一次主动的调用渲染。
        5.2 在对模板中的数据initState进行依赖收集时，通过给每个属性增加dep，在模板取值触发get时，让dep收集当前watcher，再让watcher收集dep，
            （每个属性都有一个dep，一个组件模板页面是一个watcher，一个组件有多个属性也就是一个watcher对应多个dep，一个属性可在多个组件使用也就是一个属性又对应多个watcher。让该属性的dep记住当前这个组件的watcher；也让当前组件的这个watcher记住所有属性的dep。
            一个属性可能在页面上多个地方使用，会进行多个get取值，为了避免该属性的dep中收集重复同样的watcher，通过id进行去重）。
        5.3 当数据更新时触发set，通知dep去遍历当前属性的dep收集的所有watcher，去进行渲染逻辑的调用。
    


