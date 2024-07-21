<title>信奥图床</title>

# cola-pig1121.github.io【信奥图床】

<script type="text/javascript">
          document.querySelector('.file').addEventListener('change', function(e) {
          let files = e.target.files
          if (!files.length) return
          // 上传文件 创建FormData
          let formData = new FormData()
          // 遍历FileList对象，拿到多个图片对象
          for (let i = 0; i < files.length; i++) {
          // formData中的append方法 如果已有相同的键，则会追加成为一个数组  注意:这里需要使用formData.getAll()获取
            formData.append('upFile', files[i], files[i].name)
          }
          console.log(formData.getAll('upFile'))
          //
          // axios.post('url', formData)
        })
</script>

<input type="file" class="file" name="file" multiple="multiple" />

<style>
  a{
        color: #1b1f23;
  }
  .box{
        width: auto;
        height: auto;
        background: rgba(0,0,0,0.95);
        margin: 10px auto 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
      }
</style>

## [What's it like to be a sweet couple](./What's it like to be a sweet couple.mp4)

<div class="box">
  <video width="auto" height="auto" controls margin="auto">
    <source src="./What's it like to be a sweet couple.mp4" type="video/mp4"> 
  </video>
</div>

<p></p>

## [How to cheer up Furina](./How to cheer up Furina.mp4)

<div class="box">
  <video width="auto" height="auto" controls margin="auto">
    <source src="./How to cheer up Furina.mp4" type="video/mp4"> 
  </video>
</div>

<p></p>

## [Yunli & Yanqing](./Yunli and Yanqing.mp4)

<div class="box">
  <video width="auto" height="auto" controls margin="auto">
    <source src="./Yunli and Yanqing.mp4" type="video/mp4"> 
  </video>
</div>

<p></p>
