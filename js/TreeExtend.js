function TreeExtend(option){

    var _defaultOpt = {
        colors:["#25a4f6","#92d1fa","#a2d403","#f7881f","#f7881f"],
        width:1000,
        height:800,
        container:'',//树形图容器，值为选择器
        data:''//必填，url或对象
    };

    option = $.extend(true, _defaultOpt,option);

    this.colors = option.colors;
    this.width  = option.width;
    this.height = option.height;
    this.container = option.container;
    this.data   = option.data;

}

TreeExtend.prototype.init = function(){
    var that = this;
    var padding = {left: 100, right:50, top: 20, bottom: 20 };
    var svg = d3.select(that.container)
            .append("svg")
            .attr("width", that.width + padding.left + padding.right)
            .attr("height", that.height + padding.top + padding.bottom)
            .append("g")
            .attr("transform","translate("+ padding.left + "," + padding.top + ")");
    //树状图布局
    var tree = d3.layout.tree()
        .size([that.height, that.width]);

    //对角线生成器
    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    if(Object.prototype.toString.call(that.data).toLowerCase()=='[object string]'){
        d3.json(that.data, function(error, root) {
            if (error) throw error;
            var dataFun = getRecursionFunc(root);
            root = dataFun(root,"key");
            render(root);
        });
    }else{
        render(that.data);
    }

    //获取给树形结构数据加字段的方法
    function getRecursionFunc(treeObj){
        var i = 0,initObj = treeObj;
        return function (treeObj,property){
            if(treeObj.children.length==0){
                treeObj[property] = i++;
                return initObj;
            }else{
                treeObj[property] = i++;
                for(var j=0;j<treeObj.children.length;j++){
                    treeObj.children[j][property] = i++;
                    if(j==(treeObj.children.length-1)){
                        return arguments.callee(treeObj.children[j],property);
                    }else{
                        arguments.callee(treeObj.children[j],property);
                    }
                }
            }
        };
    }



    function render(root){

        //给第一个节点添加初始坐标x0和x1，避免不自然效果
        root.x0 = that.height / 2;
        root.y0 = 0;

        //以第一个节点为起始节点，重绘
        redraw(root);

        //重绘函数
        function redraw(source){

            //(1)计算节点和连线的位置

            //应用布局，计算节点和连线
            var nodes = tree.nodes(root);
            var links = tree.links(nodes);
            //重新计算节点的y坐标
            nodes.forEach(function(d) { d.y = d.depth * 180; });

            //(2)节点的处理

            //获取节点的update部分
            var nodeUpdate = svg.selectAll(".node")
                .data(nodes, function(d){ return d.key; });

            //获取节点的enter部分
            var nodeEnter = nodeUpdate.enter();
            //获取节点的exit部分
            var nodeExit = nodeUpdate.exit();
            //1. 节点的 Enter 部分的处理办法
            var enterNodes = nodeEnter.append("g")
                .attr("class","node")
                .attr("transform", function(d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })
                .on("click", function(d) { toggle(d); redraw(d); });

            enterNodes.append("circle")
                .attr("r", 0)
                .style("fill", function(d) { 
                    return that.colors[d.depth];
                })
                .style("stroke",function(d) {
                    return that.colors[d.depth];
                });

            enterNodes.append("text")
                .on("mouseover", function(d) {//连线mousehover事件
                    d3.select(this).style("font-size","18px")
                    .style("cursor","pointer");
                })
                .on("mouseout", function(d) {//连线mouseout事件
                    d3.select(this).style("font-size","14px")
                    .style("cursor","normal");
                })
                .attr("x", function(d) { return d.children || d._children ? -14 : 14; })
                .attr("dy", ".35em")
                .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                .text(function(d) { return d.name +"("+d.number+")"; })
                .style("fill-opacity", 0);

            //2. 节点的 Update 部分的处理办法
            var updateNodes = nodeUpdate.transition()
                .duration(500)
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

            updateNodes.select("circle")
                .attr("r", function(d){
                    return ((d.number/root.number)*40<2)?1:(d.number/root.number)*20;
                })
                .style("fill", function(d) {
                    return that.colors[d.depth];
                })
                .style("stroke",function(d) {
                    return that.colors[d.depth];
                });

            updateNodes.select("text").style("fill-opacity", 1);

            //3.节点的 Exit 部分的处理办法
            var exitNodes = nodeExit.transition()
                .duration(500)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();
            exitNodes.select("circle").attr("r", 0);
            exitNodes.select("text").style("fill-opacity", 0);

            //（3） 连线的处理

            //获取连线的update部分
            var linkUpdate = svg.selectAll(".link")
                .data(links, function(d){ 
                    return d.target.key;
                });

            //获取连线的enter部分
            var linkEnter = linkUpdate.enter();

            //获取连线的exit部分
            var linkExit = linkUpdate.exit();

            //1. 连线的 Enter 部分的处理办法
            linkEnter.insert("path",".node")
                .on("mouseover", function(d) {//连线mousehover事件
                    d3.select(this).style("stroke-opacity","1")
                    .style("cursor","pointer");
                })
                .on("mouseout", function(d) {//连线mouseout事件
                    d3.select(this).style("stroke-opacity",(d.source.depth/10<0.2)?0.2:d.source.depth/10)
                    .style("cursor","normal");
                })
                .attr("class", "link")
                .style("fill","none")
                .style("stroke",function(d){
                    return that.colors[d.source.depth];
                })
                .style("stroke-width",function(d){
                    return ((d.target.number/root.number)*40<2)?2:(d.target.number/root.number)*40;
                })
                .style("stroke-linecap","round")
                .style("stroke-opacity",function(d) { 
                    return (d.source.depth/10<0.2)?0.2:d.source.depth/10;
                })
                .attr("d", function(d) {
                      var o = {x: source.x0, y: source.y0};
                      return diagonal({source: o, target: o});
                })
                .transition()
                .duration(500)
                .attr("d", diagonal);

            //2. 连线的 Update 部分的处理办法
            linkUpdate.transition()
                .duration(500)
                .attr("d", diagonal);

            //3.连线的 Exit 部分的处理办法
            linkExit.transition()
                .duration(500)
                .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                })
                .remove();


            //(4)将当前的节点坐标保存在变量x0、y0里，以备更新时使用
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

        }

        //切换开关，d 为被点击的节点
        function toggle(d){
            if(d.children){//如果有子节点
                d._children = d.children; //将该子节点保存到 _children
                d.children = null;  //将子节点设置为null
            }else{//如果没有子节点
                d.children = d._children; //从 _children 取回原来的子节点 
                d._children = null; //将 _children 设置为 null
            }
        }

    }

}
