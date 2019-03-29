<template>
  <div id="app">
    <label v-show="false" >
      <input type="file" id="files" ref="files" multiple v-on:change="handleFilesUpload()" />
    </label>
    <div class="component">
      <div class="tools">
        <div class="upload">
          <Button icon="md-cloud-upload" type="dashed" @click="addFiles">点击上传</Button>
        </div>
        <div class="transform">
          <Button icon="md-cog" type="primary" @click="transform">开始转换</Button>
        </div>
      </div>
      <div class="views">
        <Button icon="md-eye" type="primary" @click="showTable"
          v-show="data.length">渲染表格</Button>
      </div>
      <Button icon="md-cloud-download" type="primary" v-show="showDownload" @click="download">点击下载</Button>
    </div>
    <Modal v-model="modal" title="提示" @on-ok="transform" width="300">
      <p>表格上传成功，是否开始转换？</p>
    </Modal>
    <Table stripe height="500"  :loading="loading" :columns="view.columns" :data="view.data" v-show="view.data.length" ref="table"></Table>
  </div>
</template>

<script>
import XLSX from 'xlsx';
import { Table} from 'iview';
export default {
  name: 'app',
  components: { Table },
  data() {
    return {
      loading: true,
      showDownload: false,
      modal: false,
      view: { columns: [], data: [] },
      files: [],
      table: [
        { title: '盘源编码', key: 'houseCoding', sortable: true },
        { title: '楼盘名称', key: 'houseName', sortable: true },
        { title: '楼栋单元', key: 'buildUnit' },
        { title: '房号', key: 'room' },
        { title: '业主姓名', key: 'name' },
        { title: '业主电话', key: 'phone' },
        { title: '业主电话1', key: 'phone1' },
        { title: '面积', key: 'acreage', sortable: true },
        { title: '户型', key: 'houseType'},
        { title: '租价', key: 'rentPrice', sortable: true },
        { title: '租接盘人', key: 'rentBelong' },
        { title: '售价', key: 'salePrice', sortable: true },
        { title: '售接盘人', key: 'saleBelong' },
        { title: '登记人', key: 'register' },
        { title: '备注', key: 'rentComments' }
      ],
      data: [],
      json: []
    }
  },
  methods: {
      /**点击按钮选择一个xls文件 */
      addFiles() { this.$refs.files.click(); },

      /**选定文件后执行 */
      handleFilesUpload() {
        let uploadedFiles = this.$refs.files.files;
        for (var i = 0; i < uploadedFiles.length; i++) {
          this.files.push(uploadedFiles[i]);
        }
        var f = uploadedFiles[0];
        var reader = new FileReader();
        reader.onload = function (e) {
          var data = e.target.result;
          data = new Uint8Array(data);
          var workbook = XLSX.read(data, {
            type: "array"
          });
          /* DO SOMETHING WITH workbook HERE */
          var first_sheet_name = workbook.SheetNames[0];
          /* Get worksheet */
          var worksheet = workbook.Sheets[first_sheet_name];
          //It will prints with header and contents ex) Name, Home...
          var json = XLSX.utils.sheet_to_json(worksheet, {
            header: 1
          });
          json.shift();
          this.$set( this, 'json', json );
          this.modal = true;
          console.log(this.json)
        }.bind(this)
        reader.readAsArrayBuffer(f);
      },

      /**根据需求转换文件内容，该函数的代码可根据自身需求更改 */
      transform: function(){
        let regLCR = /(^[\s|,|，|。|、|\.|\||/]{1,}|[\s|,|，|。|、|\.|\||/]{1,}$)/g,
            regC = /(\-|,|，|。|~|\s|\/|、|\.|\|){1,}/g,
            num = '00000',
            word = this.getRandomWord();

        for (let i = 0; i < this.json.length; i++) {
          let data =  { houseCoding: '', houseName: '', buildUnit: '', room: '', name: '',  phone: '', phone1: '', acreage: '', houseType: '', rentPrice: '', rentBelong: '', salePrice: '', saleBelong: '', register: '', rentComments: ''};
          //  清除首尾空格及特殊字符
          let phoneArr = this.json[i][12].replace(regLCR, '');
          //  替换字中特殊字符及空格
          phoneArr = phoneArr.replace(regC, '/').split('/');
            let reg = new RegExp("\\d{" + String(i+1).length + "," + String(i+1).length + "}$");
            data.houseCoding = word + num.replace(reg, i+1);
            data.houseName = this.json[i][0];
            data.buildUnit = this.json[i][1];
            data.room = this.json[i][2] + this.json[i][3];
            data.name = this.json[i][11];
            data.phone = phoneArr.shift();
            data.phone1 = phoneArr.join('-');
            data.acreage = Number(this.json[i][4]);
            data.houseType = Number(this.json[i][5]) + '房' + Number(this.json[i][6]) + '厅';
            this.data.push(data);
        }
          this.$Message.success('转换完成，选择需要显示的数据');
      },
      showTable: function( ) {
        this.$Message.success('若文件内容过多会导致渲染数据延迟，请耐心等待');
        this.loading = true;
        setTimeout(()=>{
          this.$set( this.view, 'columns', this.table );
          this.$set( this.view, 'data', this.data );
          this.loading = false;
          this.$Message.success('表格渲染成功，可以点击下载按钮下载该表格');
          this.showDownload = true;
        })
      },

      /**
       * 1.url为HTML的XLS协议，template是XLS的书写格式
       * 2.获取表格 thead 的标签内容(包含自身)以及tbody中的内容（包含自身）
       * 3.把thead的内容替换到tbody前，并把tbody的内容替换到template中
       * 4.创建一个 a 标签并添加一个点击事件，执行下载
       * 5.需要注意一点是如果文件过大会导致下载失败，具体没测试，三四百条应该没啥问题 */
      download: function(){
        this.$Message.info({
          content: '正在下载中，若浏览器提示下载失败则是因为文件过大表格绘制异常导致提示网络错误，此时你可以选择复制表格粘贴到Excel中',
          duration: 30,
          closable: true
        });
        let url = 'data:application/vnd.ms-excel;base64,',
            templete = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>{table}</body></html>',
            thead = this.$refs.table.$refs.header.children[0].children[1].outerHTML,
            tbody = this.$refs.table.$refs.tbody.$el.outerHTML.replace(/(<colgroup>.+<\/colgroup>)/, thead),
            content = templete.replace(/({table})/, tbody),
            aEle = document.createElement('a');
            aEle.href = url + window.btoa( unescape(encodeURIComponent(content)));
            aEle.download = '唧唧复唧唧，木兰当户织.xls';
            aEle.click();
      },

      /**随机返回两个大写字母 */
      getRandomWord: function(){
        var result = [];
          for(var i=0;i<2;i++){
            var ranNum = Math.ceil(Math.random() * 25); //生成一个0到25的数字
              //大写字母'A'的ASCII是65,A~Z的ASCII码就是65 + 0~25;然后调用String.fromCharCode()传入ASCII值返回相应的字符并push进数组里
              result.push(String.fromCharCode(65+ranNum));
          }
        return  result.join('');
      }

      /**
       * @author xuewuzhijin
       * @description https://github.com/xuewuzhijin
       * 玩的开心~~~
       */
    }
}
</script>

<style lang="stylus">
#app
  .component
    display flex
    flex-direction column
    padding 30px
    .title
      text-align center
      padding 30px
      background: #f8f8f9
      margin-bottom 30px
    .tools
      display flex
      flex 2
      .upload,.transform
        flex 1
        display flex
        justify-content center
  .views
    display flex
    flex 3
    padding 15px
    .ivu-btn
      flex 1
      margin 15px

</style>  
