cordova.define('com.phonegap.plugins.Puship.PushipNotification', function(
    require,
    exports,
    module
  ) {
    //Puship Library V1.4.3 - (c)2016 SoftRay
    var Puship = Puship || {};
    var Puship = function() {};
    var _pp;
    Puship.prototype.OS = {
      IOS: { value: 1, name: 'iOS', code: 'IOS' },
      ANDROID: { value: 2, name: 'Android', code: 'ANDROID' },
      WP: { value: 3, name: 'Windows Phone', code: 'WP' },
      BLACKBERRY: { value: 4, name: 'BlackBerry', code: 'BB' }
    };
    var RESPONSESTATUS = {
      REGISTERED: { value: 200, name: 'Registered', code: 'REGISTERED' },
      GENERICERROR: { value: 500, name: 'Generic Error', code: 'GENERICERROR' },
      PERMISSIONERROR: { value: 400, name: 'Permission Error', code: 'PERMISSIONERROR' },
      DEVICELIMITERROR: { value: 401, name: 'Device Limit Error', code: 'DEVICELIMITERROR' },
      TAGLIMITERROR: { value: 402, name: 'Tag Limit Error', code: 'TAGLIMITERROR' },
      CREDENTIALERROR: { value: 403, name: 'Credential Error', code: 'CREDENTIALERROR' },
      APPLICATIONNOTFOUND: { value: 404, name: 'Application not found', code: 'APPLICATIONNOTFOUND' },
      DEVICENOTFOUND: { value: 405, name: 'Device not found', code: 'DEVICENOTFOUND' }
    };
    Puship.prototype.GCM = (function() {
      var privateInstanceIdentifier = '';
      var privateAppId = '';
      var privateDeviceType = -1;
      var privateSuccessCallback = GCM_Success;
      var privateFailCallback = GCM_Fail;
      function GCM_Event(e) {
        _pp.Common.Log('GCM_Event: ' + e.event);
        switch (e.event) {
          case 'registered':
            _pp.gcmregid = e.regid;
            if (_pp.gcmregid.length > 0) {
              _pp.Common.Log('REGISTERED -> REGID:' + e.regid);
              _pp.Common.RegisterOnPuship(e.regid, privateAppId, privateDeviceType, {
                instanceId: privateInstanceIdentifier,
                successCallback: privateSuccessCallback,
                failCallback: privateFailCallback
              });
            }
            break;
          case 'message':
            _pp.Common.Log('MESSAGE -> MSG:' + e.message);
            _pp.Common.Log('MESSAGE -> MSGCNT:' + e.msgcnt);
            _pp.Common.Log('e:' + JSON.stringify(e));
            console.log('---------------------sound:' + e.payload.foreground);
            if (e.payload.foreground) {
              if (e.payload != null) {
                _pp.Common.Log('soundname:' + e.payload.sound);
                var my_media = new Media('/android_asset/www/res/sounds/' + e.payload.sound);
                my_media.play();
              }
            } else {
              _pp.Common.Log('inline');
              _pp.Common.NotifyPush(ConvertPush(e));
            }
            break;
          case 'error':
            _pp.Common.Log('ERROR -> MSG:' + e.msg);
            privateFailCallback(e);
            break;
          default:
            alert('EVENT -> Unknown, an event was received and we do not know what it is');
            break;
        }
      }
      function GCM_Success(e) {
        _pp.Common.Log('success method');
        _pp.Common.Log('e:' + JSON.stringify(e));
        if (e == 'ALREADY REGISTERED' && privateSuccessCallback != GCM_Success) {
          privateSuccessCallback(e);
        }
        _pp.Common.Log('exit from success');
      }
      function GCM_Fail(e) {
        _pp.Common.Log('GCM_Fail -> GCM plugin failed to register');
        _pp.Common.Log('GCM_Fail -> ' + e.msg);
        privateFailCallback(e);
      }
      function ConvertPush(GCMPush) {
        _pp.Common.Log('Converting GCM...');
        var CommonPush = {
          Badge: GCMPush.payload == null ? GCMPush.msgcnt : GCMPush.payload.msgcnt,
          Alert: GCMPush.message,
          Sound: GCMPush.payload == null ? GCMPush.sound : GCMPush.payload.sound,
          Param1: GCMPush.payload == null ? GCMPush.Param1 : GCMPush.payload.Param1,
          Param2: GCMPush.payload == null ? GCMPush.Param2 : GCMPush.payload.Param2,
          Param3: GCMPush.payload == null ? GCMPush.Param3 : GCMPush.payload.Param3,
          Param4: GCMPush.payload == null ? GCMPush.Param4 : GCMPush.payload.Param4,
          Param5: GCMPush.payload == null ? GCMPush.Param5 : GCMPush.payload.Param5
        };
        _pp.Common.Log('CommonPush: ' + JSON.stringify(CommonPush));
        return CommonPush;
      }
      return {
        Register: function(GCMProject, optionalparams) {
          _pp.Common.Log('Calling GCM Register');
          privateAppId = _pp.PushipAppId;
          privateDeviceType = 2;
          if (!optionalparams) optionalparams = {};
          privateSuccessCallback = _pp.Common.DefaultValue(
            optionalparams.successCallback,
            GCM_Success
          );
          privateFailCallback = _pp.Common.DefaultValue(optionalparams.failCallback, GCM_Fail);
          privateInstanceIdentifier = _pp.Common.DefaultValue(
            optionalparams.instanceId,
            _pp.Common.GetUuid()
          );
          _pp.Common.Log('Params initialized');
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            pushNotification.register(GCM_Success, GCM_Fail, {
              senderID: GCMProject,
              ecb: 'window.plugins.puship.GCM.GCM_Event'
            });
          } else {
            return cordova.exec(GCM_Success, GCM_Fail, 'GCMPlugin', 'register', [
              { senderID: GCMProject, ecb: 'window.plugins.puship.GCM.GCM_Event' }
            ]);
          }
        },
        UnRegister: function(successCallback, failureCallback) {
          _pp.Common.Log('Start unregistering app');
          var UnregisterSuccessCallback = function() {
            _pp.Common.Log('Success Unregistering from GMC...');
            _pp.Common.UnRegisterFromPuship({
              successCallback: function() {
                successCallback();
              },
              failCallback: function(err) {
                failureCallback(err);
              }
            });
          };
          var UnregisterFailCallback = function(err) {
            _pp.Common.Log('Error Unregistering from GMC...');
            failureCallback(err);
          };
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            _pp.Common.Log('Calling CLI unregister');
            pushNotification.unregister(UnregisterSuccessCallback, UnregisterFailCallback);
          } else {
            _pp.Common.Log('Calling native unregister');
            return cordova.exec(
              UnregisterSuccessCallback,
              UnregisterFailCallback,
              'GCMPlugin',
              'unregister',
              [{}]
            );
          }
        },
        GCM_Event: GCM_Event
      };
    })();
    function PushipWPNotificationCallback(pushMessage) {
      _pp.WP.NotificationCallback(pushMessage);
    }
    Puship.prototype.WP = (function() {
      var privateInstanceIdentifier = '';
      var privateAppId = '';
      var privateDeviceType = -1;
      var privateSuccessCallback = GCM_Success;
      var privateFailCallback = GCM_Fail;
      function Register(optionalparams) {
        _pp.Common.Log('Calling WP Register');
        privateAppId = _pp.PushipAppId;
        privateDeviceType = 3;
        if (!optionalparams) optionalparams = {};
        privateSuccessCallback = _pp.Common.DefaultValue(optionalparams.successCallback, GCM_Success);
        privateFailCallback = _pp.Common.DefaultValue(optionalparams.failCallback, GCM_Fail);
        privateInstanceIdentifier = _pp.Common.DefaultValue(
          optionalparams.instanceId,
          _pp.Common.GetUuid()
        );
        _pp.Common.Log('Params initialized');
        _pp.Common.Log('Getting user token');
        var pushNotification = window.plugins.pushNotification;
        if (pushNotification != null) {
          _pp.Common.Log('Calling WP with CLI');
          pushNotification.register(RegisterResultCallBack, privateFailCallback, {
            channelName: privateAppId,
            ecb: 'window.plugins.puship.WP.NotificationCallback',
            uccb: 'window.plugins.puship.WP.channelHandler',
            errcb: 'window.plugins.puship.WP.jsonErrorHandler'
          });
        } else {
          _pp.Common.Log('Calling WP with normal plugin');
          cordova.exec(
            RegisterResultCallBack,
            privateFailCallback,
            'PushipPlugin',
            'GetUserToken',
            []
          );
        }
      }
      function RegisterResultCallBack(tokenresult) {
        _pp.Common.Log('Result token:' + JSON.stringify(tokenresult));
        var token = '';
        var pushNotification = window.plugins.pushNotification;
        if (pushNotification != null) {
          token = tokenresult.uri;
        } else {
          token = tokenresult;
        }
        if (_pp.Common.IsNullOrEmpty(token)) {
          var e = e || {};
          e.msg = 'URI is not Valid';
        } else {
          _pp.Common.RegisterOnPuship(token, privateAppId, privateDeviceType, {
            instanceId: privateInstanceIdentifier,
            successCallback: privateSuccessCallback,
            failCallback: privateFailCallback
          });
        }
      }
      function GCM_Success(e) {
        _pp.Common.Log('success method');
        _pp.Common.Log('e:' + JSON.stringify(e));
        _pp.Common.Log('exit from success');
      }
      function GCM_Fail(e) {
        _pp.Common.Log('GCM_Fail -> GCM plugin failed to register');
        _pp.Common.Log('GCM_Fail -> ' + e.msg);
        privateFailCallback(e);
      }
      function ConvertPush(MPNSPush) {
        _pp.Common.Log('Converting MPNS...' + JSON.stringify(MPNSPush));
        var CommonPush = null;
        var pushNotification = window.plugins.pushNotification;
        if (pushNotification != null) {
          if (MPNSPush.type == 'toast' && MPNSPush.jsonContent) {
            var pr = MPNSPush.jsonContent['wp:Param'];
            CommonPush = {
              Badge: _pp.Common.GetURLParameter(pr, 'msgcnt'),
              Alert: MPNSPush.jsonContent['wp:Text2'],
              Sound: _pp.Common.GetURLParameter(pr, 'sound'),
              Param1: _pp.Common.GetURLParameter(pr, 'Param1'),
              Param2: _pp.Common.GetURLParameter(pr, 'Param2'),
              Param3: _pp.Common.GetURLParameter(pr, 'Param3'),
              Param4: _pp.Common.GetURLParameter(pr, 'Param4'),
              Param5: _pp.Common.GetURLParameter(pr, 'Param5')
            };
          } else {
            _pp.Common.Log('MPNS body... ' + JSON.stringify(MPNSPush.jsonContent.Body));
          }
        } else {
          CommonPush = { Badge: 1, Alert: MPNSPush, Sound: 'default' };
        }
        _pp.Common.Log('CommonPush: ' + JSON.stringify(CommonPush));
        return CommonPush;
      }
      function channelHandler(par) {
        _pp.Common.Log('channelHandler raised with: ');
        _pp.Common.Log('param:' + JSON.stringify(par));
        RegisterResultCallBack(par);
      }
      function jsonErrorHandler(par) {
        _pp.Common.Log('jsonErrorHandler raised with:');
        _pp.Common.Log('param:' + JSON.stringify(par));
        privateFailCallback(par);
      }
      function NotificationCallback(notification) {
        _pp.Common.Log('raising puship event');
        _pp.Common.NotifyPush(ConvertPush(notification));
      }
      return {
        Register: Register,
        UnRegister: function(successCallback, failureCallback) {
          _pp.Common.Log('Start unregistering app from WP');
          var UnregisterSuccessCallback = function() {
            _pp.Common.Log('Success Unregistering from WP...');
            _pp.Common.UnRegisterFromPuship({
              successCallback: function() {
                successCallback();
              },
              failCallback: function(err) {
                failureCallback(err);
              }
            });
          };
          var UnregisterFailCallback = function(err) {
            _pp.Common.Log('Error Unregistering from WP...');
            failureCallback(err);
          };
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            _pp.Common.Log('Calling CLI unregister');
            var channelName = _pp.PushipAppId;
            pushNotification.unregister(UnregisterSuccessCallback, UnregisterFailCallback, {
              channelName: channelName
            });
          } else {
            _pp.Common.Log('Calling native unregister');
            return cordova.exec(
              UnregisterSuccessCallback,
              UnregisterFailCallback,
              'GCMPlugin',
              'unregister',
              [{}]
            );
          }
        },
        NotificationCallback: NotificationCallback,
        channelHandler: channelHandler,
        jsonErrorHandler: jsonErrorHandler
      };
    })();
    Puship.prototype.APNS = (function() {
      var privateInstanceIdentifier = '';
      var privateAppId = '';
      var privateDeviceType = -1;
      var privateSuccessCallback = GCM_Success;
      var privateFailCallback = GCM_Fail;
      var privatePushCallback = PushCallback;
      var privateApntoken = '';
      function PushCallback(push) {
        _pp.Common.Log('push received');
      }
      function GCM_Success(e) {
        _pp.Common.Log('success method');
        _pp.Common.Log('e:' + JSON.stringify(e));
        _pp.Common.Log('exit from success');
      }
      function GCM_Fail(e) {
        _pp.Common.Log('GCM_Fail -> GCM plugin failed to register');
        _pp.Common.Log('GCM_Fail -> ' + e.msg);
        privateFailCallback(e);
      }
      function ConvertPush(APNPush) {
        var CommonPush = {
          Badge: APNPush.badge,
          Alert: APNPush.alert != null ? APNPush.alert : APNPush.body,
          Sound: APNPush.sound,
          Param1: APNPush.Param1,
          Param2: APNPush.Param2,
          Param3: APNPush.Param3,
          Param4: APNPush.Param4,
          Param5: APNPush.Param5
        };
        _pp.Common.Log('CommonPush: ' + JSON.stringify(CommonPush));
        return CommonPush;
      }
      return {
        Register: function(optionalparams) {
          _pp.Common.Log('Calling APNS Register');
          privateAppId = _pp.PushipAppId;
          privateDeviceType = 1;
          if (!optionalparams) optionalparams = {};
          privateSuccessCallback = _pp.Common.DefaultValue(
            optionalparams.successCallback,
            GCM_Success
          );
          privateFailCallback = _pp.Common.DefaultValue(optionalparams.failCallback, GCM_Fail);
          privateInstanceIdentifier = _pp.Common.DefaultValue(
            optionalparams.instanceId,
            _pp.Common.GetUuid()
          );
          privatePushCallback = _pp.Common.DefaultValue(optionalparams.pushCallback, PushCallback);
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            _pp.Common.Log('Registering with CLI');
            pushNotification.register(
              function(resultToken) {
                _pp.Common.Log('token: ' + resultToken);
                privateApntoken = resultToken;
                _pp.Common.RegisterOnPuship(resultToken, privateAppId, privateDeviceType, {
                  instanceId: privateInstanceIdentifier,
                  successCallback: privateSuccessCallback,
                  failCallback: privateFailCallback
                });
              },
              function(status) {
                _pp.Common.Log('Error callback');
                _pp.Common.Log('Many fact can cause this:');
                _pp.Common.Log('- Do you select the correct provisiong profile in the code signing?');
                _pp.Common.Log(
                  '- Are you using a new device that is not present in the provisiong profile?'
                );
                _pp.Common.Log('registerDevice: ' + JSON.stringify(status));
                privateFailCallback(status);
              },
              {
                badge: 'true',
                sound: 'true',
                alert: 'true',
                ecb: 'window.plugins.puship.APNS.notificationCallback'
              }
            );
          } else {
            _pp.Common.Log('Registering with Manual Installation');
            _pp.APNS.registerDevice(
              { alert: true, badge: true, sound: true },
              function(status) {
                _pp.Common.Log('token: ' + status.deviceToken);
                privateApntoken = status.deviceToken;
                _pp.Common.Log('registerDevice: ' + JSON.stringify(status));
                _pp.Common.RegisterOnPuship(status.deviceToken, privateAppId, privateDeviceType, {
                  instanceId: privateInstanceIdentifier,
                  successCallback: privateSuccessCallback,
                  failCallback: privateFailCallback
                });
              },
              function(status) {
                _pp.Common.Log('Error callback');
                _pp.Common.Log('registerDevice: ' + JSON.stringify(status));
                privateFailCallback(status);
              }
            );
          }
        },
        registerDevice: function(config, successCallback, errorCallback) {
          cordova.exec(
            successCallback,
            errorCallback,
            'PushNotification',
            'registerDevice',
            config ? [config] : []
          );
        },
        getPendingNotifications: function(callback) {
          cordova.exec(callback, callback, 'PushNotification', 'getPendingNotifications', []);
        },
        getRemoteNotificationStatus: function(callback) {
          cordova.exec(callback, callback, 'PushNotification', 'getRemoteNotificationStatus', []);
        },
        setApplicationIconBadgeNumber: function(badge, callback) {
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            _pp.Common.Log('setApplicationIconBadgeNumber with CLI');
            pushNotification.setApplicationIconBadgeNumber(callback, callback, badge);
          } else {
            _pp.Common.Log('setApplicationIconBadgeNumber with Manual Installation');
            cordova.exec(callback, callback, 'PushNotification', 'setApplicationIconBadgeNumber', [
              { badge: badge }
            ]);
          }
        },
        cancelAllLocalNotifications: function(callback) {
          cordova.exec(callback, callback, 'PushNotification', 'cancelAllLocalNotifications', []);
        },
        notificationCallback: function(notification) {
          _pp.Common.Log('notification: ' + JSON.stringify(notification));
          _pp.Common.Log('raising puship event');
          if (window.plugins.pushNotification != null)
            _pp.Common.NotifyPush(ConvertPush(notification));
          else _pp.Common.NotifyPush(ConvertPush(notification.aps));
        },
        UnRegister: function(successCallback, failureCallback) {
          _pp.Common.Log('Start unregistering apple device');
          var UnregisterSuccessCallback = function() {
            _pp.Common.Log('Success Unregistering from GMC...');
            _pp.Common.UnRegisterFromPuship({
              successCallback: function() {
                successCallback();
              },
              failCallback: function(err) {
                failureCallback(err);
              }
            });
          };
          var UnregisterFailCallback = function(err) {
            _pp.Common.Log('Error Unregistering from GMC...');
            failureCallback(err);
          };
          var pushNotification = window.plugins.pushNotification;
          if (pushNotification != null) {
            _pp.Common.Log('Unregistering with push plugin');
            pushNotification.unregister(UnregisterSuccessCallback, UnregisterFailCallback);
          } else {
            _pp.Common.Log('Calling fake unregister');
            UnregisterSuccessCallback();
          }
        }
      };
    })();
    Puship.prototype.BPNS = (function() {
      var privateInstanceIdentifier = '';
      var privateAppId = '';
      var privateDeviceType = -1;
      var privateSuccessCallback = null;
      var privateFailCallback = null;
      var iport = 32200;
      var iserverUrl = '';
      var iappId = '';
      var imax = 100;
      var iwakeUpPage = 'index.html';
      function REG_Success(e) {
        _pp.Common.Log('success method');
        _pp.Common.Log('e:' + JSON.stringify(e));
        if (privateSuccessCallback) {
          privateSuccessCallback(e);
        }
        _pp.Common.Log('exit from success');
      }
      function REG_Fail(e) {
        _pp.Common.Log('BB Fail -> BB plugin failed to register');
        if (privateFailCallback) {
          privateFailCallback(e);
        }
        _pp.Common.Log('BB Fail -> BB plugin failed to register');
      }
      function onRegister(status) {
        _pp.Common.Log('Service call done with status: ' + status);
        if (status == 0) {
          _pp.Common.Log('Registration done');
          _pp.Common.RegisterOnPuship(GetToken(), privateAppId, privateDeviceType, {
            instanceId: privateInstanceIdentifier,
            successCallback: REG_Success,
            failCallback: REG_Fail
          });
        } else if (status == 1) {
          alert('push register status network error');
        } else if (status == 2) {
          alert('push register status rejected by server');
        } else if (status == 3) {
          alert('push register status invalid parameters');
        } else if (status == -1) {
          alert('push register status general error');
        } else {
          alert('push register status unknown');
        }
      }
      function ConvertPush(BPNPush) {
        var CommonPush = {
          Badge: 1,
          Alert: blackberry.utils.blobToString(BPNPush.payload),
          Sound: 'default'
        };
        _pp.Common.Log('CommonPush: ' + JSON.stringify(CommonPush));
        return CommonPush;
      }
      function onData(data) {
        _pp.Common.Log('Push notifications received');
        try {
          _pp.Common.Log('data received: ' + JSON.stringify(data));
          var resultpush = ConvertPush(data);
          _pp.Common.Log('raising puship event');
          _pp.Common.NotifyPush(resultpush);
          return 0;
        } catch (err) {
          _pp.Common.Log('error from push notification data: ' + err);
        }
      }
      function onSimChange() {
        _pp.Common.Log('handle Sim Card change');
      }
      function OpenBISPushListener() {
        try {
          _pp.Common.Log('Calling BB services');
          var ops = {
            port: iport,
            appId: iappId,
            serverUrl: iserverUrl,
            wakeUpPage: iwakeUpPage,
            maxQueueCap: imax
          };
          blackberry.push.openBISPushListener(ops, onData, onRegister, onSimChange);
        } catch (err) {
          _pp.Common.Log('Error during open listener:' + err);
          try {
            _pp.Common.Log('try shotdown listener');
            blackberry.push.closePushListener();
          } catch (er) {
            _pp.Common.Log('error during closing listener: ' + er);
          }
        }
      }
      function GetToken() {
        return blackberry.identity.PIN;
      }
      return {
        Register: function(port, serverUrl, appId, optionalparams) {
          _pp.Common.Log('Initializing BPNS variables');
          iport = port;
          iserverUrl = serverUrl;
          iappId = appId;
          if (!optionalparams) optionalparams = {};
          privateAppId = _pp.PushipAppId;
          privateDeviceType = 4;
          privateSuccessCallback = optionalparams.successCallback;
          privateFailCallback = optionalparams.failCallback;
          privateInstanceIdentifier = _pp.Common.DefaultValue(
            optionalparams.instanceId,
            _pp.Common.GetUuid()
          );
          imax = _pp.Common.DefaultValue(optionalparams.max, imax);
          iwakeUpPage = _pp.Common.DefaultValue(optionalparams.wakeUpPage, iwakeUpPage);
          _pp.Common.Log('Calling BPNS Register');
          OpenBISPushListener();
        },
        UnRegister: function(successCallback, failCallback) {
          blackberry.push.closePushListener();
          _pp.Common.UnRegisterFromPuship({
            successCallback: function() {
              _pp.Common.Log('Success Unregistering from BPM...');
              successCallback();
            },
            failCallback: function(err) {
              failureCallback(err);
            }
          });
        }
      };
    })();
    Puship.prototype.Common = (function() {
      var privateCurrentPlatform = null;
      function IsNullOrEmpty(value) {
        return !value || value == undefined || value == '' || value.length == 0;
      }
      function GetURLParameter(url, name) {
        return (
          decodeURIComponent(
            (new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(url) || [, ''])[1].replace(
              /\+/g,
              '%20'
            )
          ) || null
        );
      }
      function DefaultValue(arg, def) {
        return typeof arg == 'undefined' ? def : arg;
      }
      function GetAppId() {
        if (_pp.PushipAppId == null) {
          _pp.Common.Log('PushipAppId is NOT setted');
          return null;
        }
        return _pp.PushipAppId;
      }
      function WriteResponceStatus(code) {
        if (code == RESPONSESTATUS.REGISTERED.value) {
          _pp.Common.Log(RESPONSESTATUS.REGISTERED.name);
        } else if (code == RESPONSESTATUS.GENERICERROR.value) {
          _pp.Common.Log(RESPONSESTATUS.GENERICERROR.name);
        } else if (code == RESPONSESTATUS.APPLICATIONNOTFOUND.value) {
          _pp.Common.Log(RESPONSESTATUS.APPLICATIONNOTFOUND.name);
        } else if (code == RESPONSESTATUS.PERMISSIONERROR.value) {
          _pp.Common.Log(RESPONSESTATUS.PERMISSIONERROR.name);
        } else if (code == RESPONSESTATUS.DEVICELIMITERROR.value) {
          _pp.Common.Log(RESPONSESTATUS.DEVICELIMITERROR.name);
        } else if (code == RESPONSESTATUS.TAGLIMITERROR.value) {
          _pp.Common.Log(RESPONSESTATUS.TAGLIMITERROR.name);
        } else if (code == RESPONSESTATUS.CREDENTIALERROR.value) {
          _pp.Common.Log(RESPONSESTATUS.CREDENTIALERROR.name);
        } else if (code == RESPONSESTATUS.DEVICENOTFOUND.value) {
          _pp.Common.Log(RESPONSESTATUS.DEVICENOTFOUND.name);
        } else {
          _pp.Common.Log('Code not found');
        }
      }
      function NotifyPush(push) {
        _pp.Common.Log('NotifyPush Callback:' + push);
        var ev;
        _pp.Common.Log('dispatch for firefox + others');
        ev = document.createEvent('HTMLEvents');
        ev.notification = push;
        ev.initEvent('puship-notification', true, true, push);
        document.dispatchEvent(ev);
        _pp.Common.Log('notificationCallback dispached');
      }
      function OnPushReceived(callback) {
        _pp.Common.Log('setting callback');
        document.addEventListener('puship-notification', callback);
        _pp.Common.Log('setting callback done');
      }
      function AddTagFilter(tag, optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship addfilter success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship addfilter fail managed');
        });
        var pRemovePrevTag = DefaultValue(optionalparams.removePrevTag, false);
        _pp.Common.Log('Adding Tag Filter...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        _pp.Common.Log('Tag:' + tag);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/AddTagFilter?AppId='" +
          appKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&Tag='" +
          tag +
          "'&RemovePrevTag=" +
          pRemovePrevTag +
          '&$format=json';
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                var code = JSON.parse(request.responseText).d.AddTagFilter;
                if (code == 200) {
                  _pp.Common.Log('Filter added succesfully');
                  pSuccessCallBack(this);
                } else {
                  _pp.Common.Log('Error during filter adding execution');
                  WriteResponceStatus(code);
                  pFailCallBack(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during filter adding' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling AddTagFilter endpoint');
        request.send();
      }
      function RemoveTagFilter(tag, optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship removefilter success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship removefilter fail managed');
        });
        _pp.Common.Log('Removing Tag Filter...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        _pp.Common.Log('Tag:' + tag);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/RemoveTagFilter?AppId='" +
          appKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&Tag='" +
          tag +
          "'&$format=json";
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                var code = JSON.parse(request.responseText).d.RemoveTagFilter;
                if (code == 200) {
                  _pp.Common.Log('Filter removed succesfully');
                  pSuccessCallBack(this);
                } else {
                  _pp.Common.Log('Error during filter removing execution');
                  WriteResponceStatus(code);
                  pFailCallBack(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during Filter removing' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling RemoveTagFilter endpoint');
        request.send();
      }
      function UnRegisterFromPuship(optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship unregister success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship unregister fail managed');
        });
        _pp.Common.Log('deleteing push...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/UnRegisterDevice?AppId='" +
          appKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&$format=json";
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                _pp.Common.Log(request.responseText);
                var pp = JSON.parse(request.responseText);
                var code = JSON.parse(request.responseText).d.UnRegisterDevice;
                if (code == 200) {
                  _pp.Common.Log('Device unregisted successfully');
                  pSuccessCallBack(this);
                } else {
                  _pp.Common.Log('Error during device unregistration execution');
                  WriteResponceStatus(code);
                  pFailCallBack(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing: ' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during Push delete: ' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling DeletePushMessages endpoint');
        request.send();
      }
      function DeletePushMessage(push_id, optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship removefilter success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship removefilter fail managed');
        });
        _pp.Common.Log('deleteing push...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        _pp.Common.Log('Push_Id:' + push_id);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/DeletePushMessages?AppId='" +
          appKey +
          "'&strPushMessageId='" +
          push_id +
          "'&$format=json";
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                _pp.Common.Log(request.responseText);
                var pp = JSON.parse(request.responseText);
                var res = JSON.parse(request.responseText).d.DeletePushMessages;
                if (res.Error == false) {
                  _pp.Common.Log('Push deleted successfully');
                  pSuccessCallBack(res);
                } else {
                  _pp.Common.Log('Error during push delete execution');
                  WriteResponceStatus(code);
                  pFailCallBack(res);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing: ' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during Push delete: ' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling DeletePushMessages endpoint');
        request.send();
      }
      function CleanTagFilter(optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship cleanfilter success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship cleanfilter fail managed');
        });
        _pp.Common.Log('Cleaning Tag Filter...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/CleanTagFilter?AppId='" +
          appKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&$format=json";
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onload = function() {
          _pp.Common.Log('Processing CleanTagFilter responce');
          if (this.status == 200 || this.status == 201) {
            var code = JSON.parse(this.response).d.CleanTagFilter;
            if (code == 200) {
              _pp.Common.Log('Filter cleaned succesfully');
              pSuccessCallBack(this);
            } else {
              _pp.Common.Log('Error during filter cleaning execution');
              WriteResponceStatus(code);
              pFailCallBack(this);
            }
          } else {
            _pp.Common.Log('Error during filter cleaning call: ' + this.statusText);
            pFailCallBack(this);
          }
        };
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                var code = JSON.parse(request.responseText).d.CleanTagFilter;
                if (code == 200) {
                  _pp.Common.Log('Filter cleaned succesfully');
                  pSuccessCallBack(this);
                } else {
                  _pp.Common.Log('Error during filter cleaning execution');
                  WriteResponceStatus(code);
                  pFailCallBack(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during push getting' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling CleanTagFilter endpoint');
        request.send();
      }
      function GetTagFilters(optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship getfilter success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship getfilter fail managed');
        });
        _pp.Common.Log('Get Tag Filters...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/GetTagFilters?AppId='" +
          appKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&$format=json";
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                pSuccessCallBack(JSON.parse(request.responseText).d);
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during filter getting' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling GetTagFilters endpoint');
        request.send();
      }
      var pushOptionalParams = null;
      function GetPushMessages(optionalparams) {
        if (!optionalparams) {
          pushOptionalParams = {};
        } else {
          pushOptionalParams = optionalparams;
        }
        if (pushOptionalParams.byCurrentPosition == true) {
          if (pushOptionalParams.Latitude == null || pushOptionalParams.Longitude == null) {
            if (GetCurrentOs() == _pp.OS.ANDROID) {
              optionalparams.enableHighAccuracy = true;
            }
            navigator.geolocation.getCurrentPosition(
              pushCurrentPositionSuccess,
              pushCurrentPositionError,
              optionalparams
            );
          } else {
          }
        } else {
          GetPushMessagesInternal(pushOptionalParams);
        }
      }
      function pushCurrentPositionSuccess(position) {
        _pp.Common.Log(
          'Latitude: ' +
            position.coords.latitude +
            '\n' +
            'Longitude: ' +
            position.coords.longitude +
            '\n' +
            'Altitude: ' +
            position.coords.altitude +
            '\n' +
            'Accuracy: ' +
            position.coords.accuracy +
            '\n' +
            'Altitude Accuracy: ' +
            position.coords.altitudeAccuracy +
            '\n' +
            'Heading: ' +
            position.coords.heading +
            '\n' +
            'Speed: ' +
            position.coords.speed +
            '\n' +
            'Timestamp: ' +
            position.timestamp +
            '\n'
        );
        pushOptionalParams.Latitude = position.coords.latitude;
        pushOptionalParams.Longitude = position.coords.longitude;
        GetPushMessagesInternal(pushOptionalParams);
      }
      function pushCurrentPositionError(error) {
        var pFailCallBack = DefaultValue(pushOptionalParams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship GetPushMessage fail managed');
        });
        _pp.Common.Log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        pFailCallBack(error);
      }
      function GetPushMessagesInternal(optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var privateLimit = DefaultValue(optionalparams.limit, 20);
        var privateOffset = DefaultValue(optionalparams.offset, 0);
        var privateTags = DefaultValue(optionalparams.tag, '');
        var adddevicepush = DefaultValue(optionalparams.addDevicePush, false);
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship GetPushMessages success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship GetPushMessages fail managed');
        });
        var privateIncludeParams = DefaultValue(optionalparams.includeParams, false);
        _pp.Common.Log('Get Push Messages...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        _pp.Common.Log('Tag:' + privateTags);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "Services/Puship.svc/GetPushMessages?AppId='" +
          appKey +
          "'&DeviceType=" +
          GetCurrentOs().value +
          '&Limit=' +
          privateLimit +
          '&Offset=' +
          privateOffset +
          "&Tags='" +
          privateTags +
          "'" +
          '&IncludeParams=' +
          privateIncludeParams +
          '';
        if (adddevicepush) {
          getstr += "&DeviceId='" + encodeURIComponent(deviceId) + "'";
        }
        if (optionalparams.Latitude) getstr += '&Latitude=' + optionalparams.Latitude;
        if (optionalparams.Longitude) getstr += '&Longitude=' + optionalparams.Longitude;
        getstr += '&$format=json';
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                pSuccessCallBack(JSON.parse(request.responseText).d);
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during push getting' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling GetPushMessages endpoint');
        request.send();
      }
      function GetPushMessagesByDevice(optionalparams) {
        if (!optionalparams) optionalparams = {};
        var appKey = _pp.PushipAppId;
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var privateLimit = DefaultValue(optionalparams.limit, 20);
        var privateOffset = DefaultValue(optionalparams.offset, 0);
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship GetPushMessagesByDevice success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship GetPushMessagesByDevice fail managed');
        });
        _pp.Common.Log('Get Push Messages...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "Services/Puship.svc/GetPushMessagesByDevice?DeviceId='" +
          encodeURIComponent(deviceId) +
          "'&Limit=" +
          privateLimit +
          '&Offset=' +
          privateOffset;
        getstr += '&$format=json';
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                pSuccessCallBack(JSON.parse(request.responseText).d);
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during push getting' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling GetPushMessagesByDevice endpoint');
        request.send();
      }
      function RegisterOnPuship(deviceToken, appKey, deviceType, optionalparams) {
        _pp.Common.Log('Registering on Puship...');
        if (!optionalparams) optionalparams = {};
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship fail managed');
        });
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        _pp.Common.Log('Token:' + deviceToken);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        _pp.Common.Log('DeviceType:' + deviceType);
        var getstr =
          _pp.Domain +
          "services/puship.svc/RegisterDevice?AppId='" +
          appKey +
          "'&DeviceType=" +
          deviceType +
          "&Token='" +
          deviceToken +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&language='en'";
        getstr += '&$format=json';
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              var code = JSON.parse(request.responseText).d.RegisterDevice;
              if (code == 200) {
                _pp.Common.Log('Registered succesfully');
                this.DeviceToken = deviceToken;
                this.DeviceId = deviceId;
                pSuccessCallBack(this);
              } else {
                _pp.Common.Log('Error during registration device execution');
                WriteResponceStatus(code);
                pFailCallBack(this);
              }
            } else {
              _pp.Common.Log('Error during registration' + this.statusText);
              pFailCallBack({res: this, token: deviceToken, deviceId: deviceId});
            }
          }
        };
        _pp.Common.Log('Calling RegisterOnPuship endpoint');
        request.send();
      }
      function UnRegister(successCallback, failureCallback) {
        var cOS = GetCurrentOs();
        var UnregisterSuccessCallback = _pp.Common.DefaultValue(successCallback, function() {
          _pp.Common.Log('Success Unregistering app');
        });
        var UnregisterFailCallback = _pp.Common.DefaultValue(failureCallback, function(err) {
          _pp.Common.Log('Error during Unregistering app');
          _pp.Common.Log('error:' + JSON.stringify(err));
        });
        if (cOS == _pp.OS.ANDROID) {
          _pp.GCM.UnRegister(UnregisterSuccessCallback, UnregisterFailCallback);
        } else if (cOS == _pp.OS.WP) {
          _pp.WP.UnRegister(UnregisterSuccessCallback, UnregisterFailCallback);
        } else if (cOS == _pp.OS.IOS) {
          _pp.APNS.UnRegister(UnregisterSuccessCallback, UnregisterFailCallback);
        } else {
          _pp.BPNS.UnRegister(UnregisterSuccessCallback, UnregisterFailCallback);
        }
      }
      function SendPushByDevice(message, devices, optionalparams) {
        _pp.Common.Log('Sending Push by Device');
        var appKey = _pp.PushipAppId;
        if (!optionalparams) optionalparams = {};
        _pp.Common.Log('Optional params: ' + JSON.stringify(optionalparams));
        var privateInstanceIdentifier = DefaultValue(optionalparams.instanceId, _pp.Common.GetUuid());
        var pSuccessCallBack = DefaultValue(optionalparams.successCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship success managed');
        });
        var pFailCallBack = DefaultValue(optionalparams.failCallback, function(pushipresult) {
          _pp.Common.Log('Internal puship fail managed');
        });
        var privateSound = DefaultValue(optionalparams.sound, 'default');
        var privatePush = DefaultValue(optionalparams.push, 'True');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + appKey);
        var deviceId = appKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr = _pp.Domain + 'services/puship.svc/SendPushMessageByDevicePost?$format=json';
        _pp.Common.Log('RequestTo: ' + getstr);
        var postparams = 'language=en&AppId=' + appKey + '&Devices=' + JSON.stringify(devices);
        postparams = postparams + '&Message=' + message;
        postparams = postparams + '&Push=' + privatePush;
        postparams = postparams + '&Sound=' + privateSound;
        if (optionalparams.params != null) {
          postparams = postparams + '&Params=' + JSON.stringify(optionalparams.params);
        }
        _pp.Common.Log('PostParams: ' + postparams);
        request.open('POST', getstr, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.setRequestHeader('Content-length', postparams.length);
        request.setRequestHeader('Connection', 'close');
        request.onreadystatechange = function() {
          _pp.Common.Log('onreadystatechange');
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce:' + request.responseText);
            if (request.status == 200 || request.status == 201) {
              var res = JSON.parse(request.responseText).d.SendPushMessageByDevicePost;
              if (res.Error == false) {
                _pp.Common.Log('Push sent successfully');
                pSuccessCallBack(res);
              } else {
                _pp.Common.Log('Error during push sent execution');
                WriteResponceStatus(code);
                pFailCallBack(res);
              }
            } else {
              _pp.Common.Log('Error during SendPushByDevice' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling SendPushByDevice endpoint');
        request.send(postparams);
      }
      var positionAppKey = null;
      var initMaxRegisterQueue = false;
      var lastpositionCheck = null;
      function RegisterCurrentPosition(optionalparams) {
        _pp.Common.Log('RegisterCurrentPosition');
        if (!initMaxRegisterQueue) {
          maxRegisterQueue = _pp.PositionQueueLenght;
          initMaxRegisterQueue = true;
        }
        positionAppKey = _pp.PushipAppId;
        if (!optionalparams) {
          positionOptionalParams = {};
          positionOptionalParams.enableHighAccuracy = false;
          positionOptionalParams.callMinutes = _pp.MinimumSingleLocationCallDelayMinutes;
          positionOptionalParams.minimumAccuracy = _pp.MinimumAccuracy = 50;
        } else {
          positionOptionalParams = optionalparams;
          if (
            positionOptionalParams.callMinutes != null &&
            positionOptionalParams.callMinutes < _pp.MinimumSingleLocationCallDelayMinutes
          )
            positionOptionalParams.callMinutes = _pp.MinimumSingleLocationCallDelayMinutes;
          if (positionOptionalParams.minimumAccuracy == null)
            positionOptionalParams.minimumAccuracy = _pp.MinimumAccuracy;
        }
        positionOptionalParams.successCallback = DefaultValue(
          positionOptionalParams.successCallback,
          function(pushipresult) {
            _pp.Common.Log('Internal puship RegisterPosition success managed');
          }
        );
        positionOptionalParams.failCallback = DefaultValue(
          positionOptionalParams.failCallback,
          function(pushipresult) {
            _pp.Common.Log('Internal puship RegisterPosition fail managed');
          }
        );
        if (GetCurrentOs() == _pp.OS.ANDROID) {
          positionOptionalParams.enableHighAccuracy = true;
        }
        if (lastpositionCheck != null) {
          var now = new Date();
          if (
            lastpositionCheck.getTime() + positionOptionalParams.callMinutes * 60000 >=
            now.getTime()
          ) {
            _pp.Common.Log('Position Skipped due to many request');
            positionOptionalParams.failCallback('Position Skipped due to many request');
            return;
          } else {
          }
        } else {
        }
        lastpositionCheck = new Date();
        navigator.geolocation.getCurrentPosition(
          currentPositionSuccess,
          currentPositionError,
          positionOptionalParams
        );
      }
      function verifyAccuracy(accuracyEnabled, currentAccuracy, minAccuracy) {
        if (accuracyEnabled == true && currentAccuracy != null && minAccuracy != null) {
          if (currentAccuracy < minAccuracy) return true;
          else {
            _pp.Common.Log('currentAccuracy:' + currentAccuracy + ' - minAccuracy:' + minAccuracy);
            return false;
          }
        }
        return true;
      }
      function convertPosition(originalPos) {
        var isodate = new Date(originalPos.timestamp);
        var isodatestring = ISODateString(isodate);
        var position = {};
        position.Latitude = originalPos.coords.latitude;
        position.Longitude = originalPos.coords.longitude;
        position.Accuracy = originalPos.coords.accuracy;
        position.TimeStamp = isodatestring;
        position.Speed = originalPos.coords.speed;
        position.Heading = originalPos.coords.heading;
        position.Altitude = originalPos.coords.altitude;
        position.AltitudeAccuracy = originalPos.coords.altitudeAccuracy;
        return position;
      }
      var positionWatchOptionalParamsV2 = null;
      var watchTimeoutIdV2 = null;
      var WatchPositionIsActiveV2 = false;
      function ClearWatchV2(watchID) {
        _pp.Common.Log('ClearWatch with id: ' + watchID);
        navigator.geolocation.clearWatch(watchID);
        watchTimeoutIdV2 = null;
        WatchPositionIsActiveV2 = false;
      }
      function WatchPositionV2(optionalparams) {
        _pp.Common.Log('WatchPositionV2');
        if (!WatchPositionIsActiveV2) {
          WatchPositionIsActiveV2 = true;
          positionAppKey = _pp.PushipAppId;
          if (!optionalparams) {
            positionWatchOptionalParamsV2 = {};
            positionWatchOptionalParamsV2.enableHighAccuracy = false;
            positionWatchOptionalParamsV2.callMinutes = _pp.MinimumLocationCallDelayMinutes;
            positionWatchOptionalParamsV2.minimumAccuracy = _pp.MinimumAccuracy = 50;
          } else {
            positionWatchOptionalParamsV2 = optionalparams;
            if (
              positionWatchOptionalParamsV2.callMinutes != null &&
              positionWatchOptionalParamsV2.callMinutes < _pp.MinimumLocationCallDelayMinutes
            )
              positionWatchOptionalParamsV2.callMinutes = _pp.MinimumLocationCallDelayMinutes;
            if (positionWatchOptionalParamsV2.minimumAccuracy == null)
              positionWatchOptionalParamsV2.minimumAccuracy = _pp.MinimumAccuracy;
          }
          if (GetCurrentOs() == _pp.OS.ANDROID) {
            positionWatchOptionalParamsV2.enableHighAccuracy = true;
          }
          var timeToWait = positionWatchOptionalParamsV2.callMinutes * 60000;
          _pp.Common.Log('WatchPositionV2 event setted with: ' + timeToWait);
          watchTimeoutIdV2 = setInterval(function() {
            _pp.Common.Log('watchPositionSuccessV2 setTimeout raised');
            if (
              !WatchPositionIsActiveV2 &&
              watchTimeoutIdV2 != null &&
              countItemOnLocalStorage('watchPositionQueue') == 0
            ) {
              clearTimeout(watchTimeoutIdV2);
              _pp.Common.Log('watchtimout stopped');
            } else {
              internalWatchTryToUploadV2();
            }
          }, timeToWait);
          return navigator.geolocation.watchPosition(
            watchPositionSuccessV2,
            currentWatchPositionError,
            positionWatchOptionalParamsV2
          );
        }
      }
      function watchPositionSuccessV2(position) {
        if (
          !verifyAccuracy(
            positionWatchOptionalParamsV2.enableHighAccuracy,
            position.coords.accuracy,
            positionWatchOptionalParamsV2.minimumAccuracy
          )
        ) {
          _pp.Common.Log('Position skipped due to inadeguate accuracy');
          return;
        }
        _pp.Common.Log(
          'New pos, Lat:' + position.coords.latitude + ', Lon:' + position.coords.longitude
        );
        pushItemToLocalStorage('watchPositionQueue', convertPosition(position));
      }
      function internalWatchTryToUploadV2() {
        var positiontoupload = getLastItemsFromLocalStorage(
          'watchPositionQueue',
          _pp.PositionQueueLenght
        );
        var positionToUploadLenght = Object.keys(positiontoupload).length;
        if (positionToUploadLenght == 0) return;
        _pp.Common.Log('positionToUploadLenght.lenght: ' + positionToUploadLenght);
        var postparams = 'positions=' + JSON.stringify(positiontoupload);
        var privateInstanceIdentifier = DefaultValue(
          positionWatchOptionalParamsV2.instanceId,
          _pp.Common.GetUuid()
        );
        var pSuccessCallBack = DefaultValue(positionWatchOptionalParamsV2.successCallback, function(
          pushipresult
        ) {
          _pp.Common.Log('Internal puship RegisterPosition success managed');
        });
        var pFailCallBack = DefaultValue(positionWatchOptionalParamsV2.failCallback, function(
          pushipresult
        ) {
          _pp.Common.Log('Internal puship RegisterPosition fail managed');
        });
        var request = new XMLHttpRequest();
        var deviceId = positionAppKey.toString() + '_' + privateInstanceIdentifier;
        var getstr =
          _pp.Domain +
          "services/puship.svc/RegisterMultiPosition?AppId='" +
          positionAppKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&$format=json";
        request.open('POST', getstr, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
        request.setRequestHeader('Content-length', postparams.length);
        request.setRequestHeader('Connection', 'close');
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            if (request.status == 200 || request.status == 201) {
              try {
                var code = JSON.parse(request.responseText).d.RegisterMultiPosition;
                if (code == 200) {
                  _pp.Common.Log('MultiPositions Registered succesfully: ' + positionToUploadLenght);
                  removeItemsFromLocalStorage('watchPositionQueue', positionToUploadLenght);
                  pSuccessCallBack(this);
                } else {
                  _pp.Common.Log('Error during MultiPositions execution');
                  pFailCallBack(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing ' + this.statusText);
                pFailCallBack(e);
              }
            } else {
              _pp.Common.Log('Error during call to MultiPositions ' + this.statusText);
              pFailCallBack(this);
            }
          }
        };
        _pp.Common.Log('Calling MultiPositions endpoint');
        request.send(postparams);
      }
      function countItemOnLocalStorage(keyid) {
        var arr = localStorage.getObj(keyid);
        if (arr == null) {
          arr = [];
        }
        return arr.length;
      }
      function pushItemToLocalStorage(keyid, item) {
        var arr = localStorage.getObj(keyid);
        if (arr == null) {
          arr = [];
        }
        arr.push(item);
        localStorage.setObj(keyid, arr);
      }
      function getLastItemsFromLocalStorage(keyid, number) {
        var arr = localStorage.getObj(keyid);
        if (arr == null) {
          arr = [];
          return arr;
        }
        var result = arr.splice(0, number);
        return result;
      }
      function removeItemsFromLocalStorage(keyid, number) {
        var arr = localStorage.getObj(keyid);
        if (arr == null) {
          arr = [];
        }
        arr.splice(0, number);
        localStorage.setObj(keyid, arr);
      }
      function currentPositionSuccess(position) {
        if (
          !verifyAccuracy(
            positionOptionalParams.enableHighAccuracy,
            position.coords.accuracy,
            positionOptionalParams.minimumAccuracy
          )
        ) {
          lastpositionCheck = null;
          _pp.Common.Log('Position skipped due to inadeguate accuracy');
          positionOptionalParams.failCallback('Position skipped due to inadeguate accuracy');
          return;
        }
        _pp.Common.Log('Optional params: ' + JSON.stringify(positionOptionalParams));
        _pp.Common.Log(
          'Latitude: ' +
            position.coords.latitude +
            '\n' +
            'Longitude: ' +
            position.coords.longitude +
            '\n' +
            'Altitude: ' +
            position.coords.altitude +
            '\n' +
            'Accuracy: ' +
            position.coords.accuracy +
            '\n' +
            'Altitude Accuracy: ' +
            position.coords.altitudeAccuracy +
            '\n' +
            'Heading: ' +
            position.coords.heading +
            '\n' +
            'Speed: ' +
            position.coords.speed +
            '\n' +
            'Timestamp: ' +
            position.timestamp +
            '\n'
        );
        var isodate = new Date(position.timestamp);
        var isodatestring = ISODateString(isodate);
        _pp.Common.Log('ISO date: ' + isodatestring);
        var privateInstanceIdentifier = DefaultValue(
          positionOptionalParams.instanceId,
          _pp.Common.GetUuid()
        );
        _pp.Common.Log('Registering Position...');
        var request = new XMLHttpRequest();
        _pp.Common.Log('AppId:' + positionAppKey);
        var deviceId = positionAppKey.toString() + '_' + privateInstanceIdentifier;
        _pp.Common.Log('DeviceIdentifier:' + deviceId);
        var getstr =
          _pp.Domain +
          "services/puship.svc/RegisterPosition?AppId='" +
          positionAppKey +
          "'&DeviceIdentifier='" +
          encodeURIComponent(deviceId) +
          "'&Latitude=" +
          position.coords.latitude +
          '&Longitude=' +
          position.coords.longitude +
          '&Accuracy=' +
          position.coords.accuracy +
          "&TimeStamp=datetime'" +
          isodatestring +
          "'";
        if (position.coords.speed) getstr += '&Speed=' + position.coords.speed;
        if (position.coords.heading) getstr += '&Heading=' + position.coords.heading;
        if (position.coords.altitude) getstr += '&Altitude=' + position.coords.altitude;
        if (position.coords.altitudeAccuracy)
          getstr += '&AltitudeAccuracy=' + position.coords.altitudeAccuracy;
        getstr += '&$format=json';
        _pp.Common.Log('RequestTo:' + getstr);
        request.open('GET', getstr, true);
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            _pp.Common.Log('Processing responce');
            if (request.status == 200 || request.status == 201) {
              try {
                var code = JSON.parse(request.responseText).d.RegisterPosition;
                if (code == 200) {
                  _pp.Common.Log('Position Registered succesfully');
                  positionOptionalParams.successCallback(this);
                } else {
                  _pp.Common.Log('Error during registration position execution');
                  WriteResponceStatus(code);
                  positionOptionalParams.failCallback(this);
                }
              } catch (e) {
                _pp.Common.Log('Error during responce parsing' + this.statusText);
                positionOptionalParams.failCallback(e);
              }
            } else {
              _pp.Common.Log('Error during call to registration position' + this.statusText);
              positionOptionalParams.failCallback(this);
            }
          }
        };
        _pp.Common.Log('Calling RegisterPosition endpoint');
        request.send();
      }
      function currentWatchPositionError(error) {
        _pp.Common.Log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        positionWatchOptionalParamsV2.failCallback(error);
      }
      function currentPositionError(error) {
        _pp.Common.Log('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        lastpositionCheck = null;
        positionOptionalParams.failCallback(error);
      }
      function GetUuid() {
        var deviceid = localStorage.getItem('device.uuid');
        if (deviceid == null) {
          deviceid = device.uuid;
          localStorage.setItem('device.uuid', deviceid);
        }
        return deviceid;
      }
      function Log(l) {
        if (_pp.EnableLog == true) {
          console.log(l);
        }
        if (_pp.EnableHtmlLog == true) {
          var htmllog = document.getElementById('logp');
          if (htmllog) {
            if (htmllog.innerHTML.length > 5000)
              htmllog.innerHTML = htmllog.innerHTML.substring(0, 5000);
            htmllog.innerHTML =
              new Date().toLocaleTimeString() + ' - ' + l + '<br>' + htmllog.innerHTML;
          }
        }
      }
      function GetCurrentOs() {
        if (privateCurrentPlatform == null) {
          var cPlatform = device.platform;
          _pp.Common.Log('returned value as: ' + cPlatform);
          if (cPlatform.indexOf('Android') >= 0) {
            privateCurrentPlatform = _pp.OS.ANDROID;
          } else if (cPlatform.indexOf('Win') >= 0) {
            privateCurrentPlatform = _pp.OS.WP;
          } else if (
            cPlatform.indexOf('iPhone') >= 0 ||
            cPlatform.indexOf('iPad') >= 0 ||
            cPlatform.indexOf('iOS') >= 0
          ) {
            privateCurrentPlatform = _pp.OS.IOS;
          } else {
            privateCurrentPlatform = _pp.OS.BLACKBERRY;
          }
        }
        return privateCurrentPlatform;
      }
      function Clean() {
        var cOS = GetCurrentOs();
        if (cOS == _pp.OS.ANDROID) {
        } else if (cOS == _pp.OS.WP) {
        } else if (cOS == _pp.OS.IOS) {
          _pp.APNS.setApplicationIconBadgeNumber(0);
        } else {
        }
      }
      function ISODateString(d) {
        return (
          d.getUTCFullYear() +
          '-' +
          pad(d.getUTCMonth() + 1) +
          '-' +
          pad(d.getUTCDate()) +
          'T' +
          pad(d.getUTCHours()) +
          ':' +
          pad(d.getUTCMinutes()) +
          ':' +
          pad(d.getUTCSeconds()) +
          'Z'
        );
      }
      function pad(n) {
        return n < 10 ? '0' + n : n;
      }
      return {
        OnPushReceived: OnPushReceived,
        NotifyPush: NotifyPush,
        RegisterOnPuship: RegisterOnPuship,
        AddTagFilter: AddTagFilter,
        RemoveTagFilter: RemoveTagFilter,
        CleanTagFilter: CleanTagFilter,
        GetTagFilters: GetTagFilters,
        GetPushMessages: GetPushMessages,
        DeletePushMessage: DeletePushMessage,
        GetPushMessagesByDevice: GetPushMessagesByDevice,
        GetCurrentOs: GetCurrentOs,
        Clean: Clean,
        Log: Log,
        GetUuid: GetUuid,
        UnRegisterFromPuship: UnRegisterFromPuship,
        UnRegister: UnRegister,
        RegisterCurrentPosition: RegisterCurrentPosition,
        GetAppId: GetAppId,
        DefaultValue: DefaultValue,
        IsNullOrEmpty: IsNullOrEmpty,
        GetURLParameter: GetURLParameter,
        SendPushByDevice: SendPushByDevice,
        WatchPosition: WatchPositionV2,
        ClearWatch: ClearWatchV2
      };
    })();
    window.onbeforeunload = function(e) {
      _pp.Common.Log('Unloading...');
      if (_pp.gcmregid.length > 0) {
        _pp.Common.Log('Local unregistering app...');
        if (window.plugins && window.plugins.GCM) {
          _pp.Common.Log('Try unregisterding GCM...');
          _pp.GCM.UnRegister(
            function() {
              _pp.Common.Log('unregistered done');
            },
            function() {
              _pp.Common.Log('unregisteder error');
            }
          );
          _pp.Common.Log('Try unregisterding GCM... Called');
        }
      }
    };
    if (!window.plugins) {
      window.plugins = {};
    }
    if (!window.plugins.puship) {
      window.plugins.puship = new Puship();
      _pp = window.plugins.puship;
      _pp.PushipAppId = null;
      _pp.EnableLog = false;
      _pp.EnableHtmlLog = false;
      _pp.MinimumLocationCallDelayMinutes = 5;
      _pp.MinimumSingleLocationCallDelayMinutes = 1;
      _pp.MinimumAccuracy = 50;
      _pp.PositionQueueLenght = 300;
      _pp.Domain = 'https://cloudapp.puship.com/';
      _pp.gcmregid = '';
    }
    if (typeof module != 'undefined' && module.exports) {
      module.exports = Puship;
    }
    Storage.prototype.setObj = function(key, obj) {
      return this.setItem(key, JSON.stringify(obj));
    };
    Storage.prototype.getObj = function(key) {
      return JSON.parse(this.getItem(key));
    };
  });
