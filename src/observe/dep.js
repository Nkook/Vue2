// 首次渲染的时候会收集， 更新的时候会再次收集。
// 只有在模板里取值的时候，才会做依赖收集。

let id = 0;
// 8-1. 每个属性都有dep，创建一个类
class Dep{
    constructor(){
        this.id = id++; // 属性的dep要收集watcher；每次执行id就++
        this.subs = [];// 这里存放着当前属性对应的watcher有哪些; 一个属性可能有多个watcher（一个属性可以在a组件用，b组件用...）；
        // 8-3 
        // 此时再去boserve/index.js中给每个属性增加dep，let dep = new Dep()
        // 有了dep也有了watcher，如何让他俩关联起来？可以把当前的watcher暴漏在全局上；Dep.target = null;
        // 在watcher.js中把当前的watcher赋值给全局变量Dep.target
    }
    // 8-5
    depend(){
        // 这里我们不希望放重复的watcher，而且刚才只是一个单向的关系 dep收集-> watcher；也希望 watcher记录 ->dep
        // watcher 记录dep
        // this.subs.push(Dep.target); // 把当前的watcher放入这个栈中。这样存在重复

        Dep.target.addDep(this); // 让当前watcher（Dep.target）记住dep。 在watcher.js中实现这个方法。

        // 8-7
        // dep 和 watcher是一个多对多的关系 （一个属性可以在多个组件中使用 dep -> 多个watcher）
        // 一个组件中由多个属性组成 （一个watcher 对应多个dep）
    }
    // 8-6
    addSub(watcher){
        this.subs.push(watcher) // 将watcher放入subs
    }
    // 8-8
    notify(){
        this.subs.forEach(watcher=>watcher.update()); // 告诉watcher要更新了，让这里subs所有记住的依赖都调用更新方法
    }
}
// 8-4
Dep.target = null; // 可以把当前的watcher暴漏在全局上

// 8-2. 导出
export default Dep;
