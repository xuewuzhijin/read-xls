import Vue from 'vue'
import App from './App.vue'
import 'iview/dist/styles/iview.css';
import { Message, Button, Icon, Modal } from 'iview'

Vue.component('Button', Button);
Vue.component('Icon', Icon);
Vue.component('Modal', Modal);
Vue.prototype.$Message = Message;
Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
