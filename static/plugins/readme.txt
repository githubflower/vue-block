解压前： plugin_a.rar
解压后：
plugin_a
    *index.html       UI界面，必须有
    (xx.js, xx.css)   UI资源可直接写在html中，也可以是单独的文件，注意需要使用相对路径进行引用
    (app---           nodejs编写的服务端应用处理程序，如果有的话需放在app目录下，可以有多个nodejs程序
        xx1.js
        xx2.js
    )
    *cfg.json         插件版本、菜单位置等信息，必须有


第三方插件导入规则：
1. 如果用户想按照李群机器人开放的接口开发一套插件a，这套插件a必须以rar压缩包形式提供，
2. 压缩包名称即为插件名称，--这里是'plugin_a', 这个插件的描述是'插件a'，描述体现在菜单上，
3. 提供一个完整的UI页面以及UI层面的js、css、image资源等，
4. 如果这个插件有提供web server端的nodejs处理程序，则需要将所有nodejs程序放在app目录，
5. 如果涉及web server端的处理程序则导入成功后需要重启机器人的Web Server，否则只刷新浏览器即可。