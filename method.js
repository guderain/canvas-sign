    const saveBtn = document.getElementById('save')
    const resetBtn = document.getElementById('reset')
    const lastStepBtn = document.getElementById('lastStep')
    const range = document.querySelector('#range')

    let history = []
    let currentPath = null;
   
    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    // 签名板白色
    ctx.fillStyle = '#fff'
    ctx.fillRect(0,0,canvas.width,canvas.height)

    // 画笔颜色
    ctx.strokeStyle = 'black'
    
    // 笔画结束时的样式
    ctx.lineCap = 'round'
    // 笔画连接处的样式
    ctx.lineJoin = 'round'

    // 判断是否移动端
    const mobileStatus = (/Android|webOS|iPhone|iPad/i.test(navigator.userAgent))

    let flag =false

    // 按下
    canvas.addEventListener(mobileStatus ? 'touchstart':'mousedown',function(e){
        flag = true
        ctx.beginPath()
        // 获取偏移量及坐标
        const {offsetX,offsetY,pageX,pageY} = mobileStatus ? e.changedTouches[0] : e
        // 画笔粗细 
        ctx.lineWidth = range.value || 2
        ctx.moveTo(offsetX?offsetX:pageX,offsetY?offsetY:pageY)
        // 记录当前笔画
        currentPath = {
            color:ctx.strokeStyle,
            width:ctx.lineWidth,
            path:[{x:offsetX?offsetX:pageX,y:offsetY?offsetY:pageY}]
        }
        // 移动
        canvas.addEventListener(mobileStatus?'touchmove':'mousemove',movePen)
        // 抬起
        canvas.addEventListener(mobileStatus?'touchend':'mouseup',penUp)
    })

    // 移动
    const movePen = (e)=>{
        if(flag){
            const {offsetX,offsetY,pageX,pageY} = mobileStatus ? e.changedTouches[0] : e
            ctx.lineTo(offsetX?offsetX:pageX,offsetY?offsetY:pageY)
            currentPath.path.push({x:offsetX?offsetX:pageX,y:offsetY?offsetY:pageY})
            // 画出笔画
            ctx.stroke()
        }
    }

    // 抬起
    const penUp = (e)=>{
        flag = false
        history.push(currentPath)
        // 移除事件
        canvas.removeEventListener('mousemove',movePen)
        canvas.removeEventListener('mouseup',penUp)
    }

    // 移出画布去除事件
    canvas.addEventListener('mouseleave',function(e){
        canvas.removeEventListener('mousemove',movePen)
    })

    function drawHistory(history){
        history.forEach(currentPath=>{
            ctx.beginPath();
            ctx.lineWidth = currentPath.width
            ctx.moveTo(currentPath.path[0].x,currentPath.path[0].y)
            // 第一个点已经在moveTo中画了
            currentPath.path.slice(1).forEach(p=>{
                ctx.lineTo(p.x,p.y)
            })
            ctx.stroke()
        })
    }

    // 撤销
    lastStepBtn.addEventListener('click',e=>{
        if(history.length === 0) return
        // 删除最后一步记录
        history.pop()
        // 清除画布
        ctx.clearRect(0,0,canvas.width,canvas.height)
        // 重画
        ctx.fillStyle = '#fff'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        drawHistory(history)
    })

    // 重置
    resetBtn.addEventListener('click',function(){
        ctx.clearRect(0,0,canvas.width,canvas.height)
        history = []
        ctx.fillStyle = '#fff'
        ctx.fillRect(0,0,canvas.width,canvas.height)
    })

    // 保存上传至服务器
    saveBtn.addEventListener('click',function(){
        const imgUrl = canvas.toDataURL({format: "image/png", quality:1, width:600, height:400})
        const arr = imgUrl.split(',')
        const mimeType = arr[0].match(/:(.*?);/)[1]
        /*
        将base64编码的数据转换为普通字符串
        因为base64编码使用了一些特殊的字符来表示二进制数据，普通字符串更好操作。
        */ 
        const bytes = atob(arr[1])
        /*
        文件对象需要以字节数组的形式表示数据。
        通过创建Uint8Array对象将普通字符串转换为字节数组
        并将转换后的字符的Unicode编码复制到其中，可以将普通字符串表示的数据转换为字节数组，以便后续创建文件对象时使用。
        */ 
        const n = bytes.length
        const fileFormat = new Uint8Array(n)
        while(n--){
            fileFormat[n] = bytes.charCodeAt(n)
        }
        const fileName = '签名.jpg'
        const file = new File([fileFormat], fileName, { type: mimeType })
        //上传到服务器
        const formData = new FormData()
        formData.append('file',file)
        // 接口
    })