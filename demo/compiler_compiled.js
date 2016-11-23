function anonymous(locals
/**/) {

      function __sanitize__ (s) {
        return s && s.toString() && s.toString()
          .replace('&', '&amp;')
          .replace(/ /g, '&nbsp;')
          .replace(/</g, '&lt;')
          .replace(/>/g,'&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .replace(/￠/g, '&cent;')
          .replace(/£/g, '&pound;')
          .replace(/¥/g, '&yen;')
          .replace(/€/g,'&euro;')
          .replace(/§/g,'&sect;')
          .replace(/©/g,'&copy;')
          .replace(/®/g,'&reg;')
          .replace(/™/g,'&trade;')
          .replace(/×/g,'&times;')
          .replace(/÷/g,'&divide;')
      };

      var __result__ = '';

__result__ += "<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Document</title>\n</head>\n<body>\n  "
__result__ += "<!-- 插值 -->"
__result__ += "\n  "
__result__ += __sanitize__((function(){
      try{
        return  console
      } catch(e) {
        return ""
      }
    })())
__result__ += "\n  "
__result__ += "<!-- {{ 212@21 }} -->"
__result__ += "\n\n  "
__result__ += "<!-- 不转义 -->"
__result__ += "\n  "
__result__ += __sanitize__((function(){
      try{
        return  html
      } catch(e) {
        return ""
      }
    })())
__result__ += "\n\n  "
__result__ += "<!-- 代码 -->"
__result__ += "\n  ";
(function(){
      try{
         var name = 1
      } catch(e) {

      }
    })()
__result__ += "\n  "
__result__ += "<!-- {{- sasa@asas }} -->"
__result__ += "\n\n  "
__result__ += "<!-- {{---ss}} -->"
__result__ += "\n  "
/*  注释  */
__result__ += "\n\n  "
__result__ += "<!-- 条件 -->"
__result__ += "\n  "
if ((function(){
      try{
        return some
      } catch(e) {
        return false
      }
    })()) {
__result__ += "\n    <a href=\"#if\"></a>\n  "
}
else if ((function(){
      try{
        return  bla
      } catch(e) {
        return false
      }
    })()) {
__result__ += "\n    <a href=\"#lese\"></a>\n  "
}
__result__ += "\n\n  "
if ((function(){
      try{
        return obj.name['1234']
      } catch(e) {
        return false
      }
    })()) {
__result__ += "\n  "
}
__result__ += "\n\n  "
if ((function(){
      try{
        return true
      } catch(e) {
        return false
      }
    })()) {
__result__ += "\n  "
}
__result__ += "\n\n  "
__result__ += "<!-- 迭代 -->"
__result__ += "\n  "
for(var __index__ = 0; __index__ < ((function(){
      try{
        return array
      } catch(e) {
        return []
      }
    })()).length; __index__++){
var item = ((function(){
      try{
        return array
      } catch(e) {
        return []
      }
    })())[__index__];
__result__ += "\n    console\n  "
}
__result__ += "\n\n  "
__result__ += "<!-- 指令 -->"
__result__ += "\n  "
__result__ += "<!-- {{extend some}} -->"
__result__ += "\n  "
__result__ += "<!-- {{extend else}} -->"
__result__ += "\n  "
__result__ += "\n  "
__result__ += "<div>\n  "
__result__ += __sanitize__((function(){
      try{
        return  hello
      } catch(e) {
        return ""
      }
    })())
__result__ += "\n</div>\n\n"
__result__ += "\n\n"
__result__ += "<!-- {{extend hello}} -->"
__result__ += "\n\n  "
__result__ += "<!-- 模板继承 -->"
__result__ += "\n  "
__result__ += "\n    override\n  "
__result__ += "\n  "
__result__ += "\n    append\n  "
__result__ += "\n  "
__result__ += "\n    prepend\n  "
__result__ += "\n\n  "
if ((function(){
      try{
        return name === '你呢'
      } catch(e) {
        return false
      }
    })()) {
__result__ += "\n    "
__result__ += __sanitize__((function(){
      try{
        return '你呢'
      } catch(e) {
        return ""
      }
    })())
__result__ += "\n  "
}
__result__ += "\n</body>\n</html>"
return __result__;
}

anonymous()