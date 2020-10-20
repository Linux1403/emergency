//index.js
const app = getApp()

Page({
  data: {
    record: {
      No: "",
      Name: "",
      Address: "",
      MealInfo: "",
      Remark: ""
    },
    flag: true,
    submitFlag: false,
    btnDisabled: false,
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: '', 
    options: [{
      city_id: '001',
      city_name: '中餐'
    }, {
      city_id: '002',
      city_name: '西餐'
    }, {
      city_id: '003',
      city_name: '面食'
      }, {
        city_id: '004',
        city_name: '麻辣烫'
      }],
    selected: {}
  },
  submit(e) {
    console.log(e); 
    let model = Object.assign({}, e.detail.value);
    if (!model.No || !model.Name || !model.Address || !model.MealInfo.length) {
      toast("请填写完整信息");
      return;
    }
    if (util.isNumber(model.No) == false) {
      toast("编号只能为数字");
      return;
    }
    this.setData({ btnDisabled: true });

    model.MealInfo = model.MealInfo.join(",");
    // console.log(model);
    fetch("Wechat/MealRecord/CreateRecord", { model }).then(res => {
      console.log(res);
      if (res.data.code) {
        //转向成功页面
        wx.navigateTo({
          url: '/pages/result/result?id=666',
        })
      } else {
        toast(res.data.msg);
        this.setData({ btnDisabled: false });
      }
      //this.onLoad(); //刷新页面
    }).catch(res => {
      console.log("catch");
      toast(res.errMsg);
      this.setData({ btnDisabled: false });
    })
  },

  change(e) {
    this.setData({
      selected: { ...e.detail }
    })
    wx.showToast({
      title: `${this.data.selected.id} - ${this.data.selected.name}`,
      icon: 'success',
      duration: 1000
    })
  },
  close() {
    // 关闭select
    this.selectComponent('#select').close()
  },
  onLoad: function() {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              })
            }
          })
        }
      }
    })
  },

  onGetUserInfo: function(e) {
    if (!this.data.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      })
    }
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        wx.navigateTo({
          url: '../userConsole/userConsole',
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
        wx.navigateTo({
          url: '../deployFunctions/deployFunctions',
        })
      }
    })
  },

  // 上传图片
  doUpload: function () {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {

        wx.showLoading({
          title: '上传中',
        })

        const filePath = res.tempFilePaths[0]
        
        // 上传图片
        const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log('[上传文件] 成功：', res)

            app.globalData.fileID = res.fileID
            app.globalData.cloudPath = cloudPath
            app.globalData.imagePath = filePath
            
            wx.navigateTo({
              url: '../storageConsole/storageConsole'
            })
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })

      },
      fail: e => {
        console.error(e)
      }
    })
  },

})
