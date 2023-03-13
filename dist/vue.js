(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    // 重写数组中的部分方法，最后把重写的对象返回出去

    // 1. 首先拿到原来的数组的方法，通过原型
    let oldArrayProto = Array.prototype;

    // 2. 不能直接修改原来的，需要扩展出来一份。生成一份新的数组方法
    // newArrayProto.__proto__ = oldArrayProto
    let newArrayProto = Object.create(oldArrayProto); // Object.create() 方法用于创建一个新对象，使用现有的对象来作为新创建对象的原型（prototype）。

    // 找到所有的变异方法，就是能修改原数组的方法
    let methods = ['push', 'pop', 'shift', 'unshift', 'reverse', 'sort', 'splice']; // concat slice都不会改变原数组

    // 3. 重写这个方法
    methods.forEach(method => {
      // arr.push(1, 2, 3)
      newArrayProto[method] = function (...args) {
        // 这里重写了数组的方法
        // push.call(arr)
        // todo...
        const result = oldArrayProto[method].call(this, ...args); // 内部调用原来的方法，函数的劫持，叫做切片编程。这里的this谁调用方法push就指向谁，arr.push调用就指向arr

        console.log('method', method);
        // 5. 拿到实例上的observeArray方法: 这里的this指的是调用方法的，data调用的，指向data,从data上获取属性__ob__，这个属性指向Observer的实例，拿到实例对象，就可以用它身上的observeArray方法
        let ob = this.__ob__;
        // 4. 需要对新增的 数据再次进行劫持
        let inserted;
        switch (method) {
          case 'push':
          case 'unshift':
            // arr.unshift(1, 2, 3)
            inserted = args;
            break;
          case 'splice':
            // arr.splice(0, 1, {a: 1}, {b: 2})
            inserted = args.slice(2);
        }
        console.log(inserted); // 新增的内容
        if (inserted) {
          // 6. 对新增的内容再次进行观测：如何观测？还是通过前面的observeArray去观测，但是这里是拿不到observeArray的，
          // 只能拿到this，this指的是调用方法的对象，谁调用这些方法，this就是谁。在index.js可以看到data.__proto__ = newArrayProto，是data调用的这些方法，那么this指的就是data
          ob.observeArray(inserted);
        }
        return result;
      };
    });

    function observe(data) {
      // 对data这个对象进行劫持
      // 5-1 判断是否是对象 // 只对对象进行劫持
      if (typeof data !== 'object' || data == null) {
        return;
      }
      // 6-5 如果data上有个属性叫__ob__，它是类Observer的实例，说明这个对象被监测过了，直接把实例返回，不需要再观测了
      if (data.__ob__ instanceof Observer) {
        return data.__ob__;
      }

      // 5-2 如果一个对象被劫持过了，那就不需要再被劫持了（要判断一个对象是否被劫持过，可以增添一个实例，用实例来判断是否被劫持过）
      // 在内部又创建了一个类，这个类专门去观测数据的。如果这个数据被观测过，那么它的实例就是这个类
      // 对data这个数据进行观测
      return new Observer(data);
    }

    // 5-3
    class Observer {
      constructor(data) {
        // 6-6 如果data是个对象的话，也会加一个__ob__属性，然后进入else中，去遍历每一项，遍历到__ob__发现是个对象；会再次进入到Observer中，再添加个_ob__这样就形成了死循环。？？？？【这里理解不透彻】
        // 不能让data作为对象循环的时候遍历到这个__ob__属性，把它变成不可枚举类型，就可以了
        Object.defineProperty(data, '__ob__', {
          value: this,
          enumerable: false // 将__ob__变成不可枚举（循环的时候无法获取到）
        });
        // // 6-4 // 在data上加一个自定义属性__ob__ 把this放上去，把，this指的是Observer的实例对象
        // data.__ob__ = this  // 给数据加了一个标识，如果数据上有__ob__则说明这个属性被观测过了
        // 6-1 对象可以遍历，数组有很多个，遍历会造成性能差。如果是数组，
        if (Array.isArray(data)) {
          // 6-3 这里可以重写数组中的方法 7个变异方法，是可以修改数组本身的。
          data.__proto__ = newArrayProto; // 需要保留数组原有的特性，并且可以重写部分方法
          this.observeArray(data); // 如果数组中放的是对象，可以监控到对象的变化。
        } else {
          // 5-3 对这个数据的每个属性都劫持
          // Object.defineProperty只能劫持已经存在的属性，后增的、或删除的是不知道的。（vue2里会为此单独写一些api $set $delete）
          // 遍历这个对象
          this.walk(data);
        }
      }

      // 5-3 遍历对象进行观测
      walk(data) {
        // 循环对象，重新定义属性，对属性依次劫持
        // 重新定义属性 （性能差，相当于把属性重写了）
        // defineReactive方法 把data这个数据定义成响应式的，属性是当前的key，值是当前的data[key]。这个方法没写在类里，写在外面可以导出，其他地方也可以使用。
        Object.keys(data).forEach(key => defineReactive(data, key, data[key]));
      }
      // 6-2 遍历数组进行观测
      observeArray(data) {
        data.forEach(item => observe(item)); // 如果数组中存在引用类型，则劫持该项中的每一个属性
      }
    }

    // 5-4
    function defineReactive(target, key, value) {
      // 属性劫持。闭包，里面的函数使用外面的value，这个变量不能被销毁
      // 5-8 深度属性劫持。针对某个属性值还是个对象
      observe(value); // 对所有的对象都进行属性劫持。
      // 5-4
      Object.defineProperty(target, key, {
        get() {
          // 取值的时候会执行get
          console.log('用户取值了');
          return value;
        },
        set(newValue) {
          // 修改的时候会执行set
          console.log('用户设置值了');
          if (newValue === value) return;
          observe(newValue); // 5-9 如果修改值的时候直接赋值个对象，对这个对象里的每个属性进行劫持
          value = newValue;
        }
      });
    }

    function initState(vm) {
      const opts = vm.$options; // 获取所有的选项
      // 3. 如果选项中有data属性，则做数据初始化
      if (opts.data) {
        initData(vm);
      }
    }
    // 4. 数据初始化
    function initData(vm) {
      let data = vm.$options.data; // data可能是函数和对象
      data = typeof data === 'function' ? data.call(vm) : data; // data是用户返回的对象
      console.log(data);

      // 5-5
      // 把对象放在了实例上，并对这个对象进行了观测。此时去打印vm，会发现有个_data属性下面有name和age及其对应的get和set；但是取值需要通过vm._data.name取，无法直接通过vm.name取值
      vm._data = data; // 我将返回的对象放到了_data上

      // 5. 对数据进行劫持
      // vue2采用了一个api defineProperty
      // 提供一个方法observe 去观测data数据: 响应式模块
      observe(data);

      // 5-6 想通过vm.xxx直接取值，需要将vm_data 用vm来代理就可以了。自己定义个方法
      for (let key in data) {
        proxy(vm, '_data', key); // 代理实例vm上的某个属性key叫_data。其实就是代理_data这个属性
      }
    }

    // 5-7
    function proxy(vm, target, key) {
      // 给vm对象，添加一个属性key，并给每个属性增加存取描述符属性
      Object.defineProperty(vm, key, {
        // vm.name
        get() {
          return vm[target][key]; // vm._data.name
        },

        set(newValue) {
          vm[target][key] = newValue;
        }
      });
    }

    // 到这里就有两次数据劫持，一次是把用户的数据进行了属性劫持，一次是代理，当取值的时候代理到了某个值

    // <div id="app">
    //    <div>{{name}}</div>
    //    <span>{{age}}</span>
    // </div>
    // 3. vue2采用正则 匹配标签 属性 表达式
    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 匹配标签名<div></div>
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配到的分组是一个 标签名  <xxx 匹配到的是开始 标签的名字
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配的是</xxxx>  最终匹配到的分组就是结束标签的名字
    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性 a = "123"
    // 第一个分组就是属性的key value就是分组3/分组4/分组5
    const startTagClose = /^\s*(\/?)>/; // 匹配结束标签 </div> <br/>
    // const defaultTagRE = /\{((?:.|\r?\n)+?)\}\}/g  // 匹配到的内容就是表达式的变量{{aa}}

    // vue3 采用的不是使用正则

    // 对模版进行编译处理
    // 1-1
    function parseHTML(html) {
      // html最开始肯定是一个 <div   <div>hello</div>
      //  1-13 最终需要转化成一颗抽象语法树，需要构建父子关系。
      // 栈型结构，栈中的最后一个元素是当前匹配到开始标签的父亲。匹配到<div>放入栈；匹配到<div>放进栈，匹配到</div>结束标签时，再把<div>扔出去；匹配到<span>放入，匹配到</span>移除....
      const ELEMENT_TYPE = 1; // 元素类型为1
      const TEXT_TYPE = 3; // 文本类型为3
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
        };
      }
      //  1-11 现在只是把标签文本删掉了，并没有做任何处理替换。对这些进行处理，需要这几个方法暴漏出去，在解析到开始标签、文本、结束标签的时候进行替换。
      // 1-11-1遇到开始节点创建节点，没有根节点，就是树根；如果有父节点，那就设置为当前节点的父节点，并把当前节点作为父节点的孩子；将节点放入栈中，更更新为当前父节点
      // 利用栈型结构 来构造一颗树
      function start(tag, attrs) {
        // console.log('开始标签', tag, attrs)
        let node = createASTElement(tag, attrs); // 创造一个ast节点
        if (!root) {
          // 看一下是否空树，如果没有root根节点，那么这个节点就作为树的根节点
          root = node;
        }
        if (currentParent) {
          // 如果当前父节点有值，将当前节点的父亲节点设置为currentParent
          node.parent = currentParent; // 只赋予了parent属性
          currentParent.children.push(node); // 还需要让父亲记住自己
        }

        stack.push(node); // 将节点放入栈中
        currentParent = node; // currentParent作为栈中的最后一个节点
      }
      // 1-11-2 对于文本直接放入当前父节点的子节点中
      function chars(text) {
        // 文本直接放到当前指向的节点中
        console.log('文本', text, text.length);
        text = text.replace(/\s/g, ''); // 如果空格超过2就删除2个以上的
        text && currentParent.children.push({
          type: TEXT_TYPE,
          text,
          parent: currentParent
        });
      }
      // 1-11-3 遇到结束标签，弹出该节点，并将最后一个节点更新为当前父节点
      function end(tag) {
        // console.log('结束标签', tag)
        stack.pop(); // 遇到结束节点，弹出栈中最后一个。可以通过tag和node对比 校验标签是否合法
        currentParent = stack[stack.length - 1]; // 更新当前父节点
      }
      // 1-4 
      function advance(n) {
        html = html.substring(n); // 截取的长度就是匹配到的开始标签的长度 '<div'
      }
      // 1-3 解析开始标签 并返回匹配的结果
      function parseStartTag() {
        const start = html.match(startTagOpen); // 用html通过正则匹配看是否是开始标签
        // console.log('start', start) // ['<div', 'div', index: 0, input: '<div id="app">\n        <div>{{name}}</div>\n        <span>{{age}}</span>\n    </div>', groups: undefined]
        if (start) {
          // 如果匹配到了就是开始标签：把结果组成一个对象，把标签名、对应的属性放进去
          const match = {
            tagName: start[1],
            // 标签名
            attrs: [] // 属性
          };
          // console.log(match) // {tagName: 'div', attrs: Array(0)}
          // 1-4 需要对html不停的解析，已经解析过的要删除掉。比如，解析了开始标签，把<div>删除掉，再解析 id='app'属性。所以要有个删除的过程，写个方法，叫前进，前进长度就是匹配到的内容的总长度
          advance(start[0].length);
          // console.log(start[0], html) // 打印可以看到匹配一段就少一段 <div   id="app"><div>{{name}}</div><span>{{age}}</span></div>

          // 1-5 匹配属性：只要不是开始标签的结束!html.match(startTagClose，就一直匹配下去；拿到每次匹配的属性html.match(attribute)放到数组attr中。删除掉匹配的属性
          let attr, end;
          while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
            advance(attr[0].length); // id="app"就删掉了
            // 1-6 需要把属性解析出来放到attrs属性中去
            match.attrs.push({
              name: attr[1],
              value: attr[3] || attr[4] || attr[5] || true
            });
          }
          // 也应该把结束标签>删掉, 如果end有值就删除
          if (end) {
            advance(end[0].length);
          }
          return match;
          // 1-6
          // console.log(match) // {tagName: 'div', attrs: [{name: 'id', value: 'app'}]}
        }

        // 否则不是开始标签
        return false;
      }
      // debugger 可以看整个过程
      // 1-2 整个过程：遇到开始标签解析开始标签，遇到文本解析文本，遇到结束标签解析结束标签
      while (html) {
        // 每解析一个标签就把它从这个字符串中删除掉，整个模版字符串都没有了就解析完了 // while : 在…. 期间， 所以 while循环 就是在满足条件期间，重复执行某些代码。 continue：结束本次循环，继续下次循环。break：跳出所在的循环
        // 如果textEnd 为0 说明是一个开始标签或者结束标签 如： <div>hello</div>
        // 如果textEnd > 0说明就是文本的结束位置
        let textEnd = html.indexOf('<'); // 如果indexof中的索引是0 则说明是个标签
        // 1-2 解析标签
        if (textEnd == 0) {
          // 1-3
          const startTagMatch = parseStartTag(); // 解析开始标签 // 开始标签的匹配结果: 先匹配开始标签，再匹配属性，再匹配结束标签；并把已经匹配到的从html模版字符中删除掉；返回匹配到的结果对象{tagName: 标签名, attrs: 属性}
          // 1-7 如果是【开始标签】有值，跳过本轮操作，继续再往下走
          if (startTagMatch) {
            // 解析到的开始标签
            // 1-12
            start(startTagMatch.tagName, startTagMatch.attrs);
            // console.log(html) // 这个时候看到还是开始标签 <div>{{name}}</div><span>{{age}}</span></div>
            continue; // 为啥跳出本次循环，因为开始标签移除后，再重新循环html去找结束标签就好了。下面的代码就不再走了，如果不写，就走到下面解析文本了
          }

          // 1-9 如果不是开始标签，就是【结束标签】。匹配到后直接删除
          let endTagMatch = html.match(endTag); // 通过正则匹配结束标签，返回当前结束标签的名字
          if (endTagMatch) {
            // 如果有值就删除掉
            advance(endTagMatch[0].length);
            // 1-12
            end(endTagMatch[1]);
            continue;
          }
        }
        // 1-8 解析【文本】内容
        if (textEnd > 0) {
          let text = html.substring(0, textEnd); // 文本内容
          if (text) {
            // 1-12
            chars(text);
            advance(text.length); // 解析到的文本 
          }
        }
      }

      console.log('root', root);
      return root;
      // console.log(html, '====')
    }

    // 将html转成ast语法树

    // 2-6
    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{ asdsadsa }}  匹配到的内容就是我们表达式的变量

    // 2-2 遍历当前节点属性，把每一项通过字符串进行拼接；遇到style需要用大括号{style:{color:'red'}}
    function genProps(attrs) {
      //attrs属性在ast树上是个数组[{name: 'style', value: 'color: red; background: pink;'}]
      // 转成 {style:{"color":" red","background":" pink"}}
      let str = ''; // {name: value}
      for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i];
        if (attr.name === 'style') {
          // color:red;background:red => {color:'red', background:'red'}
          let obj = {};
          attr.value.split(';').forEach(item => {
            // 先通过分号分割成数组，再循环组成对象
            let [key, value] = item.split(':');
            obj[key] = value;
          });
          attr.value = obj;
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`; // [{name: 'id', value: 'app'}] 转成 {id:"app"}
      }

      return `{${str.slice(0, -1)}}`; // 去除最后一个字符逗号
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
      console.log('node', node);
      if (node.type === 1) {
        // 标签，需要调用方法 去 拼接tag标签，再拼接该标签的属性，再拼接节点的孩子
        return codegen(node);
      } else {
        // 纯文本，需要分两种情况 {{name}}hello   呵呵
        let text = node.text;
        if (!defaultTagRE.test(text)) {
          // 是否是纯文本，如果是文本 什么都不用做，直接返回这个纯文本字符。defaultTagRE.test('hello') == false   defaultTagRE.test('{{name}}hello') == true
          return `_v(${JSON.stringify(text)})`;
        } else {
          //_v( _s(name)+'hello' + _s(age))
          let tokens = [];
          let match; // 匹配到的文本
          defaultTagRE.lastIndex = 0; // 正则里面含有/g的话，exec每次用过之后需要重置位置，否则只能被捕获到一次
          let lastIndex = 0;
          // split
          while (match = defaultTagRE.exec(text)) {
            // 通过正则匹配到有变量的文本赋值给match。 这里的text是{{name}}hello{{age}}
            console.log('match', match); //  ['{{name}}', 'name', index: 0, input: '{{name}}hello{{age}}', groups: undefined]  ['{{age}}', 'age', index: 13, input: '{{name}}hello{{age}}', groups: undefined]
            let index = match.index; // 匹配变量的位置: 比如第一个{{name}}位置是0，第二个{{age}}是13。 {{name}} hello {{age}} hello
            if (index > lastIndex) {
              // 匹配的第二个变量的位置比上一次更新的位置大的话，说明两个变量之间存在文本，需要把文本放进去。
              tokens.push(JSON.stringify(text.slice(lastIndex, index))); // 截取 最后一次位置到当前第二个变量的位置就是中 纯文本
            }

            tokens.push(`_s(${match[1].trim()})`);
            lastIndex = index + match[0].length; // lastIndex等于当前匹配的位置加上当前匹配到变量的长度，就是整个文本最后一次的位置。 {{name}} hello {{age}}第一次index是0，长度是{{name}}8，最后一次位置更新为8
          }

          if (lastIndex < text.length) {
            // 最后匹配的位置小余整个文本的长度，需要把后面的纯文本放入
            tokens.push(JSON.stringify(text.slice(lastIndex)));
          }
          console.log('tokens', tokens); //  ['_s(name)', '"hello"', '_s(age)']
          return `_v(${tokens.join('+')})`;
        }
      }
    }
    // 2-4 遍历子节点 
    function genChildren(children) {
      return children.map(child => gen(child)).join(',');
    }
    // 2-1
    function codegen(ast) {
      // 2-3 拼接子节点
      let children = genChildren(ast.children);
      // 2-1拼接tag标签，再拼接该标签的属性，再拼接节点的孩子
      // _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))
      let code = `_c('${ast.tag}',${ast.attrs.length > 0 ? genProps(ast.attrs) : 'null'}${ast.children.length ? `,${children}` : ''})`;
      return code;
    }
    function compileToFunction(template) {
      // 1. 将template转化成ast语法树（模版针对的就是上面的内容：对于标签解析的是标签名、文本、表达式、属性、字符串等）
      let ast = parseHTML(template);
      console.log(ast);
      // 2. 将语法树 转成render方法（render方法执行后的返回结果就是 虚拟DOM）
      // 2-1 
      let code = codegen(ast); // 拿到的是字符串，想让字符串运行
      // console.log('code', code)

      // 2-7 模板引擎的实现原理 就是 with  + new Function
      code = `with(this){return ${code}}`; // with为了取值方便，this是谁就从谁身上取值。对象属性直接变成了with作用域下的
      let render = new Function(code); // 根据字符串生成render函数

      // console.log(render.toString()) 打印结果如下
      // function anonymous(
      //     ) {
      //     with(this){return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))}
      //     }
      // 通过call改变this指向vm
      // render.call(vm)

      return render;

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

    // 导出lifecycle

    // 导出mountComponent方法
    function mountComponent() {
      // 1.调用render方法产生虚拟节点 虚拟DOM

      vm._update(vm._render()); // vm.$options.render() 执行编译好的render方法，执行完后返回虚拟节点。vm._update方法是把虚拟节点变成真实节点

      // 2.根据虚拟DOM产生真实DOM 

      // 3.插入到el元素中
    }

    // vue核心流程 
    // 1） 创造了响应式数据  
    // 2） 模板转换成ast语法树  
    // 3) 将ast语法树转换了render函数 
    // 4) 后续每次数据更新可以只执行render函数 (无需再次执行ast转化的过程) // 通过传入不同的数据，render函数就可以返回不同的虚拟节点。
    // render函数会去产生虚拟节点（使用响应式数据）
    // 根据生成的虚拟节点创造真实的DOM

    function initMixin(Vue) {
      // 就是给Vue增加init方法
      Vue.prototype._init = function (options) {
        // 用于初始化操作
        // vue vm.$options 就是获取用户的配置
        // 我们使用 vue的时候，所有以$开头的都是vue自己的属性。$nextTick $data $attr....
        // 1. 把这个options放在实例上，在其他的方法里也可以拿到了。
        const vm = this; // 将实例this赋值给vm
        vm.$options = options; // 将用户的选项挂载到实例上

        // 2. 初始化状态：data 事件 计算属性等
        initState(vm);

        // 7-1
        // 如果options有el，就去挂载我们的应用
        if (options.el) {
          vm.$mount(options.el); // 实现数据的挂载
        }
      };
      // 7-2
      Vue.prototype.$mount = function (el) {
        const vm = this;
        el = document.querySelector(el); // 获取元素，获取#app对应的节点
        // 要判断一下用户的options里有没有写template模版？有没有写render函数？没有的话就用<div id="app">
        let ops = vm.$options;
        console.log(ops);
        // （1）如果没有render需要去拿到模版转成render，如果有render直接赋值给ops
        if (!ops.render) {
          // 先进行查找有没有render函数
          let template; // 没有render看一下是否写了template，没写template采用外部的template
          if (!ops.template && el) {
            // 没有写模版没有写render函数，就把el作为模版
            template = el.outerHTML;
          } else {
            if (el) {
              template = ops.template; // 写了template,就用写了的template
            }
          }

          console.log(template); // <div id="app"><div>{{name}}</div><span>{{age}}</span></div>
          // 需要将模版编译成render函数
          if (template) {
            const render = compileToFunction(template); // 把模版放进来，把模板变成了render函数
            ops.render = render; // jsx最终会被编译成h('xxx'), jsx是靠babel做的编译，有个插件plugin。？？？
          }
        }
        // （2）如果有render函数，直接赋值render到vm.$options上
        ops.render; // 最终可以获取render方法

        console.log('render', ops.render);
        // ƒ anonymous(
        //     ) {
        //     with(this){return _c('div',{id:"app"},_c('div',{style:{"color":" red","background":" pink"}},_v(_s(name)+"hello"+_s(age))),_c('span',null,_v(_s(age))))}
        //     }

        // 7-3 初步渲染 调用render方法
        // 把当前的vm实例上的render调用一下，产生虚拟dom，再把虚拟dom渲染到el中去
        mountComponent(); // 组件的挂载，挂载实例，实例里有render方法，挂载到元素el上

        // script 标签引用的vue.global.js 这个编译过程是在浏览器运行的
        // runtime运行时是不包含模版编译的，整个编译时打包的时候通过loader来转义.vue文件的。用runtime的时候不能使用模版（指的是template: '<div>hello</div>'属性）
      };
    }

    // class类是将所有的方法都耦合在一起不好维护
    function Vue(options) {
      // options就是用户的选项
      this._init(options); // 默认就调用了init
    }

    // 把原型方法扩展成一个个函数
    initMixin(Vue); // 扩展了init方法

    // 接入lifecycle.js
    lifecycle(Vue); // 扩展lifecycle方法

    return Vue;

}));
//# sourceMappingURL=vue.js.map
