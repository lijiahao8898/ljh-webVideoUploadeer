;(function ($, cobra, window, document) {

    var uploaderVideo = function (ele, options) {

        this.elementTarget = ele;

        this.defaultOptions = {
            wrapper: '',
            type: 0,                                    // type 0 展示视频选择列表 1 展示选择视频弹窗
            videoSize: 1024 * 1024 * 30,                // 单个视频的尺寸大小
            videoListNum: 1,                            // 支持视频的个数
            imgSize: 1024 * 1024,                       // 单个图片的大小
            imgListNum: 1,                              // 支持图片的数量
            selectSuccess: function (item, target) {
            },  // 视频选择 选择成功的回调函数;
            uploaderSuccess: function (item, target) {
            } // 视频上传 上传成功的回调;
        };

        this.options = $.extend({}, this.defaultOptions, options);
    };

    uploaderVideo.prototype = {

        /**
         * init()
         * 初始化
         */
        init: function () {
            this.furl = null;
            this.furlArr = [];
            this.pagecfg = {
                page_id: 1,
                page_size: 20,
                vpage: 10
            };
            if (location.host.indexOf('dev') === 0) {
                this.host = 'http://xws.seller.mockuai.com:38080/bossmanager/';
            }else{
                this.host = 'http://' + location.host + '/bossmanager/';
            }
            this.ossVideoUrl = 'http://mockuai-video.oss-cn-hangzhou.aliyuncs.com/';
            this.ossImageUrl = 'http://mockuai-oss.oss-cn-hangzhou.aliyuncs.com';
            this.uploaderUrl = this.host + 'upload_item_video.do';
            this.posterUrl = this.host + 'upload_video_shot.do';
            this.callbackUrl = this.host + 'add_video.do';
            this.videoListUrl = this.host + 'query_video.do';
            this.search_key = {};
            cobra._msgBox.init();
            this.addEvent();
            this.uploaderAddEvent();
            this.selectAddEvent();
        },

        /**
         * 打开弹框
         * @param type
         */
        openDialog: function (type) {
            var that = this;
            if (that.vumUploaderPopup) {
                that.vumUploaderPopup.close();
                that.videoUploader && that.videoUploader.destroy();
                that.videoCoverUploader && that.videoCoverUploader.destroy();
            }
            if (type == 0) {
                that.popupUploaderVideo({
                    id: 'j-vum-select-template',
                    title: '视频选择 - <a href="javascript:;" class="vumSelector" data-type="1">新视频</a>',
                    width: 600,
                    height: 600,
                    close: true
                });
                that.videoList();

            } else if (type == 1) {
                that.popupUploaderVideo({
                    id: 'j-vum-uploader-template',
                    title: '新视频 - <a href="javascript:;" class="vumSelector" data-type="0">视频选择</a>',
                    width: 500,
                    height: 620
                });
                that.initVideoUploader();
                that.initVideoCoverUploader();
            }
        },

        /**
         * 获取oss上传的必要信息 - 视频
         * @param uploader
         * @param cb
         */
        getUploadVideoInfo: function (uploader, cb) {
            var that = this;
            $.ajax({
                url: this.uploaderUrl,
                type: 'get',
                dataType: 'jsonp',
                data: {},
                complete: function (data) {

                },
                success: function (data) {
                    if (!that.handlerResponse(data)) {
                        return;
                    }
                    // console.log(data);
                    uploader.options.formData.OSSAccessKeyId = data.data.accessid;
                    uploader.options.formData.key = data.data.dir + '${filename}';
                    uploader.options.formData.expire = data.data.expire;
                    uploader.options.formData.host = data.data.host;
                    uploader.options.formData.policy = data.data.policy;
                    uploader.options.formData.signature = data.data.signature;
                    uploader.options.formData.success_action_status = 200;
                    cb && cb(data);
                },
                fail: function (data) {

                }
            });
        },

        /**
         * 获取oss上传的必要信息 - poster
         * @param uploader
         * @param cb
         */
        getUploadCoverInfo: function (uploader, cb) {
            var that = this;
            $.ajax({
                url: this.posterUrl,
                type: 'get',
                dataType: 'jsonp',
                data: {},
                complete: function (data) {

                },
                success: function (data) {
                    if (!that.handlerResponse(data)) {
                        return;
                    }
                    // console.log(data);
                    uploader.options.formData.OSSAccessKeyId = data.data.accessid;
                    uploader.options.formData.key = data.data.dir + '${filename}';
                    uploader.options.formData.expire = data.data.expire;
                    uploader.options.formData.host = data.data.host;
                    uploader.options.formData.policy = data.data.policy;
                    uploader.options.formData.signature = data.data.signature;
                    uploader.options.formData.success_action_status = 200;
                    cb && cb(data);
                },
                fail: function (data) {

                }
            });
        },

        /**
         * 上传成功后的回调给服务端
         * @param uploader
         * @param cb
         */
        addVideoToJava: function (videoType) {
            var that = this;
            var video_name;
            var image_url = (this.videoCoverUploader.getFiles()[0]).name;

            if (videoType == 1) {
                // 网络视频情况
                video_name = this.importVideo;
            } else {
                video_name = (this.videoUploader.getFiles())[0].name;
            }

            if (!video_name || !image_url) {
                cobra._msgBox.error('添加记录信息缺失！')
            }
            $.ajax({
                url: this.callbackUrl,
                type: 'get',
                dataType: 'jsonp',
                data: {
                    video_name: video_name,
                    video_url: video_name,
                    image_url: image_url,
                    type: this.type ? this.type : 1
                },
                complete: function (data) {

                },
                success: function (data) {
                    if (!that.handlerResponse(data)) {
                        return;
                    }

                    if (data.code === 10000) {
                        cobra._msgBox.done('添加记录成功！');
                        var p = [];
                        p.push(data.data);
                        that.options.uploaderSuccess(p, $(that.elementTarget));
                        that.vumUploaderPopup.close();
                    } else {
                        cobra._msgBox.error('添加记录失败！');
                    }

                },
                fail: function (data) {
                    cobra._msgBox.error('添加记录失败！')
                }
            });
        },

        /**
         * initVideoUploader()
         * 初始化 视频上传
         */
        initVideoUploader: function () {
            var that = this;
            this.videoUploader = WebUploader.create({

                // 自动上传。
                auto: false,

                // 文件拖拽区域 如果为空则false
                dnd: '',

                formData: {
                    user_id: that.options.user_id,
                    biz_code: that.options.biz_code
                },

                server: that.ossVideoUrl,

                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: {
                    id: '#vumVideoUploader',
                    innerHTML: '',
                    multiple: false
                },

                // 只允许选择文件，可选。
                accept: {
                    title: 'Video',
                    extensions: 'mp4,mov,flv,f4v',
                    mimeTypes: 'video/mp4,video/mov,video/flv,video/f4v'
                },

                // 配置生成缩略图的选项。
                thumb: {
                    width: 120,
                    height: 120,

                    // 图片质量，只有type为`image/jpeg`的时候才有效。
                    quality: 70,

                    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                    allowMagnify: true,

                    // 是否允许裁剪。
                    crop: true,

                    // 为空的话则保留原有图片格式。
                    // 否则强制转换成指定的类型。
                    type: 'jpg'
                },
                // 规定图片上传的张数 验证文件总数量, 超出则不允许加入队列。
                // 由于要传缩略图 所以 * 2
                fileNumLimit: that.options.videoListNum * 2,

                // 60 M 验证文件总大小是否超出限制, 超出则不允许加入队列
                fileSizeLimit: that.options.videoSize * that.options.videoListNum * 2,

                // 30 M 验证单个文件大小是否超出限制, 超出则不允许加入队列。
                fileSingleSizeLimit: that.options.videoSize
            });

            this.uploaderVideoFunc(this.videoUploader);
        },

        /**
         * initVideoCoverUploader()
         * 初始化 视频封面的图片上传
         */
        initVideoCoverUploader: function () {
            var that = this;
            this.videoCoverUploader = WebUploader.create({

                // 自动上传。
                auto: false,

                // 文件拖拽区域 如果为空则false
                dnd: '',

                formData: {
                    user_id: that.options.user_id,
                    biz_code: that.options.biz_code
                },

                // 文件接收服务端。
                server: that.ossImageUrl,

                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: {
                    id: '#vumImageUploader',
                    innerHTML: '',
                    multiple: false
                },

                // 只允许选择文件，可选。
                accept: {
                    title: 'Images',
                    extensions: 'gif,jpg,jpeg,png',
                    mimeTypes: 'image/jpg,image/jpeg,image/png,image/gif'
                },

                // 配置生成缩略图的选项。
                thumb: {
                    width: 120,
                    height: 120,

                    // 图片质量，只有type为`image/jpeg`的时候才有效。
                    quality: 70,

                    // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                    allowMagnify: true,

                    // 是否允许裁剪。
                    crop: true,

                    // 为空的话则保留原有图片格式。
                    // 否则强制转换成指定的类型。
                    type: ''
                },

                // 规定图片上传的张数 验证文件总数量, 超出则不允许加入队列。
                fileNumLimit: that.options.imgListNum,

                // 1 M 验证文件总大小是否超出限制, 超出则不允许加入队列
                fileSizeLimit: that.options.imgSize * that.options.imgListNum,

                // 验证单个文件大小是否超出限制, 超出则不允许加入队列。
                fileSingleSizeLimit: that.options.imgSize
            });

            this.uploaderVideoCoverFunc(this.videoCoverUploader);
        },

        /**
         * addEvent()
         * 默认事件处理
         */
        addEvent: function () {
            var that = this;

            if (that.options.wrapper && that.options.wrapper !== '') {
                $(that.options.wrapper).on('click', that.elementTarget, function () {
                    that.openDialog(that.options.type)
                });
            } else {
                $(that.elementTarget).on('click', function () {
                    that.openDialog(that.options.type)
                });
            }
        },

        /**
         * uploaderAddEvent()
         * 视频上传的事件处理
         */
        uploaderAddEvent: function () {
            var that = this;

            // 上传视频 radio 切换
            $(document).on('change', '#videoUploaderModal [name=radio]', function () {
                var type = $(this).attr('data-type');
                if (type === '0') {
                    // 本地视频
                    $('#vumVideoUploader,#vumVideoUploaderInfo').show();
                    $('#vumVideoImport').hide();
                    that.type = 1;

                    $('#videoUploaderModal input[name=radio-poster][data-type="0"]').parent().show();
                } else if (type === '1') {
                    that.type = 2;
                    // 网络视频
                    $('#vumVideoUploader,#vumVideoUploaderInfo').hide();
                    $('#vumVideoImport').show();

                    // 网络视频下只支持上传本地图片
                    $('#videoUploaderModal input[name=radio-poster][data-type="1"]').prop('checked', true);
                    $('#vumImageUploader').show();
                    $('#videoUploaderModal input[name=radio-poster][data-type="0"]').parent().hide();

                }
            });

            // 上传视频 第一帧和本地上传切换
            $(document).on('change', '#videoUploaderModal [name=radio-poster]', function () {
                var type = $(this).attr('data-type');

                if (type === '0') {
                    // 视频第一帧封面
                    // $('#vumImageUploader').hide();
                    that.wuFile && that.videoCoverUploader.addFiles(that.wuFile);
                    console.log(that.videoCoverUploader.getFiles())
                } else if (type === '1') {
                    // 上传封面
                    // $('#vumImageUploader').show();
                    var id = that.wuFile.id;
                    that.videoCoverUploader.removeFile(id, true);
                    console.log(that.videoCoverUploader.getFiles());
                    $('#vumImageUploader .vumImageFileWrapper').remove();
                }
            });

            // 上传视频 取消
            $(document).on('click', '#videoUploaderModal .vum-close', function () {
                that.vumUploaderPopup.close();
                that.videoUploader && that.videoUploader.destroy();
                that.videoCoverUploader && that.videoCoverUploader.destroy();
            });

            // 上传视频 上传
            $(document).on('click', '#videoUploaderModal .vum-uploader', function () {
                var timer = (new Date()).getTime();
                var videoType = $('#videoUploaderModal input[name=radio]:checked').attr('data-type');
                var coverType = $('#videoUploaderModal input[name=radio-poster]:checked').attr('data-type');
                var importVideo = $.trim($('#vumVideoImport input').val());
                if(importVideo.indexOf('http://') !== 0){
                    importVideo = 'http://' + importVideo;
                }
                that.importVideo = importVideo;
                console.log(coverType);

                if ($('.vumImageFileWrapper.uploadDone').length >= 1 && $('.vumVideoFileWrapper.uploadDone').length >= 1) {
                    cobra._msgBox.error('当前文件都已上传成功！请重新选择文件');
                    return false;
                }

                // 判断视频类型
                if (videoType == 0) {
                    var videoQueue = that.videoUploader.getFiles();
                    if (videoQueue.length <= 0 || !videoQueue || videoQueue[0].type != 'video/mp4') {
                        cobra._msgBox.error('未选择视频！');
                        return;
                    }
                } else if (videoType == 1) {
                    if (importVideo == '') {
                        cobra._msgBox.error('网络视频未选择！');
                        return;
                    }
                }

                // 判断封面类型
                if (coverType == 0) {
                    // 视频第一帧
                    var videoCover = that.videoCoverUploader.getFiles();
                    if (videoCover.length <= 0 || !videoCover) {
                        cobra._msgBox.error('视频图片截取失败，请联系管理员！');
                        return;
                    }
                } else if (coverType == 1) {
                    // 本地图片
                    var cover = that.videoCoverUploader.getFiles();
                    if (cover.length <= 0 || !cover) {
                        cobra._msgBox.error('本地图片未选择！');
                        return;
                    }
                }

                if (videoType == 0) {
                    that.uploadWait((that.videoUploader.getFiles()[0]));
                    that.uploadWait((that.videoCoverUploader.getFiles()[0]));
                    that.uploadingVideo(videoType, function () {
                        that.uploadingCover(coverType, function () {
                            that.addVideoToJava(videoType);
                        })
                    });
                } else if (videoType == 1) {
                    that.uploadWait((that.videoCoverUploader.getFiles()[0]));
                    that.uploadingCover(coverType, function () {
                        that.addVideoToJava(videoType);
                    })
                }

            });
        },

        uploadingCover: function (coverType, cb) {
            var that = this;

            var file_name = that.videoCoverUploader.getFiles()[0];

            if(file_name.name.indexOf('@') !== -1){
                cobra._msgBox.error('上传的文件含有"@"符号，请修改文件名称后重新上传');
                return false;
            }

            if (coverType == 1) {
                // 上传本地图片
                for (var i = 0; i < $('.vumImageFileWrapper').length; i++) {
                    var wrapper = $('.vumImageFileWrapper').eq(i);
                    var fileId = wrapper.attr('id');
                    var fail = wrapper.hasClass('uploadFail');
                    var success = wrapper.hasClass('uploadDone');
                    if (fail) {
                        $('.vumImageFileWrapper').eq(i).find('div.uploader-error').remove()
                    }
                    if (!success) {
                        // 上传成功的不再上传
                        that.getUploadCoverInfo(that.videoCoverUploader, function (data) {
                            //that.videoCoverUploader.options.formData.name = timer + 'cover';
                            that.videoCoverUploader.upload(fileId);
                            that.videoCoverUploader.on('uploadComplete', function (file) {
                                cb && cb()
                            });
                        });
                    }
                }
            } else if (coverType == 0) {
                // 上传视频第一帧
                that.getUploadCoverInfo(that.videoCoverUploader, function (data) {
                    //that.videoCoverUploader.options.formData.name = timer + 'cover';
                    that.videoCoverUploader.upload(that.wuFile.id);
                    that.videoCoverUploader.on('uploadComplete', function (file) {
                        cb && cb()
                    });
                });
            }
        },

        uploadingVideo: function (videoType, cb) {
            var that = this;

            if (videoType == 0) {
                // 上传video
                for (var n = 0; n < $('.vumVideoFileWrapper').length; n++) {
                    var videoWrapper = $('.vumVideoFileWrapper').eq(n);
                    var videoFileId = videoWrapper.attr('id');
                    var videoFail = videoWrapper.hasClass('uploadFail');
                    var videosuccess = videoWrapper.hasClass('uploadDone');
                    if (videoFail) {
                        $('.vumVideoFileWrapper').eq(n).find('div.uploader-error').remove()
                    }
                    if (!videosuccess) {
                        // 上传成功的不再上传
                        that.getUploadVideoInfo(that.videoUploader, function (data) {
                            console.log(that.videoUploader.getFiles());
                            //that.videoUploader.options.filename = timer;
                            that.videoUploader.upload(videoFileId);
                            that.videoUploader.on('uploadComplete', function (file) {
                                cb && cb()
                            });
                        });
                    } else {

                    }
                }
            }
        },

        /**
         * selectAddEvent()
         * 视频选择的事件处理
         */
        selectAddEvent: function () {
            var that = this;

            // 视频选择 - 选择事件处理
            $(document).on('click', '.vumSelect', function (e) {
                e.preventDefault();
                var $this = $(this);
                // todo 单选每次都滞空
                that.furlArr = [];

                that.furl = JSON.parse(decodeURIComponent($this.attr('data-info')));
                that.furlArr.push(that.furl);
                that.vumUploaderPopup.close();
                that.videoUploader && that.videoUploader.destroy();
                that.videoCoverUploader && that.videoCoverUploader.destroy();
                that.options.selectSuccess(that.furlArr, $(that.elementTarget));
                that.vumUploaderPopup.close();
            });

            // 视频选择 - 搜索已有视频
            $(document).on('click', '#vumSearch', function () {
                that.search_key.keywords = $.trim($('#vumKeywords').val());
                that.pagecfg.page_id = 1;
                that.videoList();
            })
        },

        /**
         * uploaderVideoFunc()
         * 视频上传逻辑
         * 支持将视频第一帧一并传上服务器
         * @param videoUploader
         */
        uploaderVideoFunc: function (videoUploader) {
            var that = this;

            // 将视频的第一帧base64图片转换成blob对象
            function dataURLtoBlob(dataurl) {
                var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], {type: mime});
            }

            videoUploader.on('startUpload', function () {
                var id = (videoUploader.getFiles()[0]).id;
                var $li = $('#' + id),
                    $error = $li.find('div.uploader-error');

                $error.remove();
            });

            // 当有文件添加前触发
            videoUploader.on('beforeFileQueued', function (file) {

                // 视频的情况下 删除堆栈里面的前一个视频
                if (file.type.indexOf('video') !== -1) {
                    that.removeOldImage(videoUploader, $('#vumVideoUploader .vum-image-list'));
                }
                if (file.size > (that.options.videoSize)) {
                    cobra._msgBox.error('当前图片的大小约为' + ((file.size / 1024) / 1024).toFixed(2) + 'MB,超出了单张上传最大为1M的限制 ！');
                    return false;
                }

                // 当第二次上传的时候，原先的图片删除掉
                $('.vumImageFileWrapper.uploadDone').remove();
            });

            // 当有文件添加进来的时候
            videoUploader.on('fileQueued', function (file) {

                var timer = (new Date()).getTime();
                // file.name = timer;
                // file.source.name = timer;
                // file.source.source.name = timer;
                console.log(file);
                var coverType = $('#videoUploaderModal input[name=radio-poster]:checked').attr('data-type');

                if (file.type.indexOf('video') !== -1) {
                    var $img;
                    $('#vumVideoUploader .vumVideoWrapper').append('<div class="vumVideoFileWrapper" id="' + file.id + '">' +
                        '<img class="vum-image-list" data-id="' + file.id + '"></div>');

                    $img = $('#vumVideoUploader .vumVideoWrapper').find('img');


                    // 视频生成预览图
                    var video = $('#video'),
                        videoURL = null,
                        windowURL = window.URL || window.webkitURL;
                    if (file) {
                        var binaryData = [];
                        binaryData.push(file.source.source);
                        videoURL = windowURL.createObjectURL(new Blob(binaryData, {type: file.type}));
                        // 本地视频预展示 现在用display = none 隐藏了而已。
                        video.html('<video src="' + videoURL + '" controls="controls"></video>');

                        setTimeout(function () {
                            var imgSrc = createIMG($img);
                            var bo = dataURLtoBlob(imgSrc);
                            var fileName = (file.name).split('.')[0] + 'cover';
                            var coverFile = new File([bo], "" + (fileName));
                            var wuFile = new WebUploader.File(new WebUploader.Lib.File(WebUploader.guid('rt_'), coverFile));
                            wuFile.type = 'image/jpeg';
                            wuFile.source.type = 'image/jpeg';
                            wuFile.source.source.type = 'image/jpeg';
                            that.wuFile = wuFile;
                            if (coverType == 0) {
                                that.videoCoverUploader.reset();
                                // 注意：存在封面的图片上传对象里面
                                that.videoCoverUploader.addFiles(wuFile);
                            }
                            console.log('video:' + videoUploader.getFiles());
                            console.log('videoCover:' + that.videoCoverUploader.getFiles());
                        }, 1000);

                    }

                    // 生成缩略图
                    var createIMG = function ($img) {
                        var scale = 0.25,
                            video = $('#video').find('video')[0],
                            canvas = document.createElement("canvas"),
                            canvasFill = canvas.getContext('2d');
                        canvas.width = video.videoWidth * scale;
                        canvas.height = video.videoHeight * scale;
                        canvasFill.drawImage(video, 0, 0, canvas.width, canvas.height);

                        var src = canvas.toDataURL("image/jpeg");

                        $img.attr('src', src);

                        setTimeout(function () {
                            $('.vumVideoFileWrapper img').css({
                                "margin-top": (135 - $('.vumVideoFileWrapper img').height()) / 2 + 'px'
                            });
                            $('.vumVideoFileWrapper img').show();
                        }, 500);
                        return src
                    };

                    /**
                     * getStats()
                     * 获取文件统计信息。返回一个包含一下信息的对象。
                     * successNum 上传成功的文件数
                     * progressNum 上传中的文件数
                     * cancelNum 被删除的文件数
                     * invalidNum 无效的文件数
                     * uploadFailNum 上传失败的文件数
                     * queueNum 还在队列中的文件数
                     * interruptNum 被暂停的文件数
                     * */
                    var info = videoUploader.getStats();
                }
            });

            videoUploader.on('uploadAccept', function (file, response) {
                console.log(response);
            });

            // 文件上传过程中创建进度条实时显示。
            videoUploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress .progress-bar');

                // 避免重复创建
                if (!$percent.length) {
                    $percent = $('<div class="progress progress-striped active">' +
                        '<div class="progress-bar" role="progressbar" style="width: 0%">' +
                        '</div><span class="progress-status">上传中...</span>' +
                        '</div>').appendTo($li).find('.progress-bar');
                }

                $percent.css('width', percentage * 100 + '%');
                $li.find('.progress-status').text((percentage * 100).toFixed(0) + '%...');
            });

            // 文件上传成功，给item添加成功class, 用样式标记上传成功。
            videoUploader.on('uploadSuccess', function (file, res, hds) {
                console.log(hds);
                // 这里就是上传成功！！
                that.uploadSuccess(file, res)
            });

            // 文件上传失败，显示上传出错。
            videoUploader.on('uploadError', function (file, res, tr) {
                // 获取状态值
                var code = tr.getStatus();
                if (code !== 200) {
                    console.log(tr);
                    that.uploadError(file, res)
                }
            });

            // 完成上传完了，成功或者失败，先删除进度条。
            videoUploader.on('uploadComplete', function (file) {
                $('#' + file.id).find('.progress').remove();
            });
        },

        /**
         * uploaderVideoCoverFunc()
         * 视频封面的图片上传逻辑
         * @param uploader
         */
        uploaderVideoCoverFunc: function (uploader) {
            var that = this;

            // 优化retina, 在retina下这个值是2
            var ratio = window.devicePixelRatio || 1,

                // 缩略图大小
                thumbWidth = 200 * ratio,
                thumbHeight = 200 * ratio;

            uploader.on('startUpload', function () {
                var id = (uploader.getFiles()[0]).id;
                var $li = $('#' + id),
                    $error = $li.find('div.uploader-error');

                $error.remove();
            });

            // 当有文件添加前触发
            uploader.on('beforeFileQueued', function (file) {

                // 每次添加进来的时候都删除原来的图片
                that.removeOldImage(uploader, $('#vumImageUploader .vum-image-list'));

                if (file.size > 1048576) {
                    cobra._msgBox.error('当前图片的大小约为' + ((file.size / 1024) / 1024).toFixed(2) + 'MB,超出了单张上传最大为1M的限制 ！');
                    return false;
                }

                // 当第二次上传的时候，原先的视频删除掉。
                $('.vumVideoFileWrapper.uploadDone').remove();
            });

            // 当有文件添加进来的时候
            uploader.on('fileQueued', function (file) {
                console.log(file);

                var $img;
                $('#vumImageUploader .vumImageWrapper').append('<div class="vumImageFileWrapper" id="' + file.id + '">' +
                    '<img class="vum-image-list" data-id="' + file.id + '"></div>');

                $img = $('#vumImageUploader .vumImageWrapper').find('img');

                // 创建缩略图
                uploader.makeThumb(file, function (error, src) {
                    if (error) {
                        $img.replaceWith('<span>亲~ 你的文件走丢了</span>');
                        return;
                    }

                    $img.attr('src', src);
                }, thumbWidth, thumbHeight);

                /**
                 * getStats()
                 * 获取文件统计信息。返回一个包含一下信息的对象。
                 * successNum 上传成功的文件数
                 * progressNum 上传中的文件数
                 * cancelNum 被删除的文件数
                 * invalidNum 无效的文件数
                 * uploadFailNum 上传失败的文件数
                 * queueNum 还在队列中的文件数
                 * interruptNum 被暂停的文件数
                 * */
                var info = uploader.getStats();
                console.log(info)
            });

            // 文件上传过程中创建进度条实时显示。
            uploader.on('uploadProgress', function (file, percentage) {
                var $li = $('#' + file.id),
                    $percent = $li.find('.progress .progress-bar');

                // 避免重复创建
                if (!$percent.length) {
                    $percent = $('<div class="progress progress-striped active">' +
                        '<div class="progress-bar" role="progressbar" style="width: 0%">' +
                        '</div><span class="progress-status">上传中...</span>' +
                        '</div>').appendTo($li).find('.progress-bar');
                }

                // $li.find('p.state').text('上传中');

                $percent.css('width', percentage * 100 + '%');
                $li.find('.progress-status').text((percentage * 100).toFixed(0) + '%...');
            });

            // 文件上传成功，给item添加成功class, 用样式标记上传成功。
            uploader.on('uploadSuccess', function (file, res) {
                console.log(res);
                // 这里就是上传成功！！
                that.uploadSuccess(file, res)
            });

            // 文件上传失败，现实上传出错。
            uploader.on('uploadError', function (file, res, tr) {
                // 获取状态值
                var code = tr.getStatus();
                if (code !== 200) {
                    console.log(tr);
                    that.uploadError(file, res)
                }
            });

            // 完成上传完了，成功或者失败，先删除进度条。
            uploader.on('uploadComplete', function (file) {
                $('#' + file.id).find('.progress').remove();
            });
        },

        uploadWait: function (file, res) {
            var $li = $('#' + file.id),
                $error = $li.find('div.uploader-error');
            if ($li.hasClass('uploadDone')) {
                return false;
            }
            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="uploader-error wait"></div>').appendTo($li);
            } else {
                $error.addClass('wait');
            }

            $error.text('上传等待中...');
            // $li.addClass('uploadFail')
            // $('#videoUploaderModal .vum-uploader').text('重新上传');
        },

        /**
         * 上传失败处理
         * @param file  文件
         * @param res   服务端回调
         */
        uploadError: function (file, res) {
            var $li = $('#' + file.id),
                $error = $li.find('div.uploader-error');

            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="uploader-error"></div>').appendTo($li);
            } else {
                $error.removeClass('wait');
                $error.addClass('error');
            }

            $error.text('上传失败');
            $li.addClass('uploadFail');
            $('#videoUploaderModal .vum-uploader').text('重新上传');
        },

        /**
         * 上传成功处理
         * @param file  文件
         * @param res   服务端回调
         */
        uploadSuccess: function (file, res) {
            var $li = $('#' + file.id),
                $error = $li.find('div.uploader-error');

            // 避免重复创建
            if (!$error.length) {
                $error = $('<div class="uploader-error success"></div>').appendTo($li);
            } else {
                $error.removeClass('wait');
                $error.addClass('success');
            }

            $error.text('上传成功！');
            $li.addClass('uploadDone');
        },

        /**
         * removeOldImage()
         * 每次添加图片的时候，删除原来的图片。
         */
        removeOldImage: function (uploader, target) {
            var file = uploader.getFiles();
            if (file.length > 0) {
                for (var i = 0; i < target.length; i++) {
                    var id = target.eq(i).attr('data-id');
                    uploader.removeFile(id, true);
                    // uploader.reset();
                    $('#' + id).remove();
                }
            }
        },


        /**
         * popupUploaderVideo()
         * 视频上传弹框
         */
        popupUploaderVideo: function (obj) {
            var that = this;
            this.vumUploaderPopup = jDialog.dialog({
                title: obj.title,
                content: $('#' + obj.id).html(),
                width: obj.width,
                height: obj.height,
                draggable: false,
                closeable: obj.close || false
            });

            $('.vumSelector').click(function () {
                var type = $(this).attr('data-type');
                that.openDialog(type)
            });

        },

        /**
         * videoList：获取视频选择的视频列表
         */
        videoList: function (callback, order) {
            var that = this;

            $.ajax({
                type: 'get',
                url: that.videoListUrl,
                dataType: 'jsonp',
                data: {
                    // biz_code: that.options.biz_code || 'mockuai_demo',
                    // user_id: that.options.user_id || '38699',
                    // path_id: 0,                                  // 所属文件夹ID，（默认0,代表获取根目录下文件列表） 暂未启用文件夹
                    video_name: that.search_key.keywords,        // 搜索的关键字
                    // order: order === undefined ? 'desc' : order, // 图片列表的排序
                    current_page: that.pagecfg.page_id,
                    page_size: that.pagecfg.page_size,
                    need_page: true
                },
                success: function (d) {
                    console.log(d);
                    if (!that.handlerResponse(d)) {
                        return;
                    }

                    if (d.code === 10000) {
                        var total = d.data.total_count;
                        var template = _.template($('#j-vum-select-video-template').html());
                        // 模板渲染
                        $('#vumSelectDialog .imgList').html(template({
                            items: d.data.data
                        }));

                        // 修改时间显示
                        // for (var i = 0; i < $('.j-time').length; i++) {
                        //     var element = $('.j-time').eq(i);
                        //     var num = element.text();
                        //     that.getLocalTime(num, element)

                        // }
                        // 查看大图
                        for (var n = 0; n < $('.j-blank-link').length; n++) {
                            var href = $('.j-blank-link').eq(n).attr('href').split('.')[$('.j-blank-link').eq(n).attr('href').split('.').length - 1];
                            // var new_href = $('.j-blank-link').eq(n).attr('href') + '@1e_500w_500h_1c_0i_1o_90Q_1x.' + href;
                            var new_href = $('.j-blank-link').eq(n).attr('href');
                            $('.j-blank-link').eq(n).attr('href', new_href)
                        }

                        if (total === 0) {
                            $('#vumSelectDialog .ui-table tbody').html('<tr><td colspan="18" style="text-align: center!important;">没有任何记录!</td></tr>');
                        }
                        that.pagination(total);

                        callback && callback()
                    }
                }
            })
        },

        // 时间戳转换
        getLocalTime: function (nS, element) {
            var time = new Date(parseInt(nS) * 1000).toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
            element.text(time)

        },

        pagination: function (total) {
            var that = this;
            $('.videoUploaderModalPagination').jqPaginator({
                totalCounts: total === 0 ? 1 : total,                                    // 设置分页的总条目数
                pageSize: that.pagecfg.page_size,                                        // 设置每一页的条目数
                visiblePages: that.pagecfg.vpage,                                        // 设置最多显示的页码数
                currentPage: that.pagecfg.page_id,                                       // 设置当前的页码
                first: '<a class="first" href="javascript:;">&lt;&lt;<\/a>',
                prev: '<a class="prev" href="javascript:;">&lt;<\/a>',
                next: '<a class="next" href="javascript:;">&gt;<\/a>',
                last: '<a class="last" href="javascript:;">&gt;&gt;<\/a>',
                page: '<a href="javascript:;">{{page}}<\/a>',
                onPageChange: function (num, type) {
                    if (type === 'change') {
                        that.pagecfg.page_id = num;
                        that.videoList()
                    }
                }
            });
        },

        // 接口请求结果处理
        handlerResponse: function (data) {
            if (data.code == 10000) {
                return true;
            } else if (data.code == 40000) {
                location.href = '../seller_info/seller_login.html';
                return false;
            } else {
                console.error(data.msg || 'error');
            }
        }
    };

    // 在插件中使用对象
    $.fn.uploaderVideoModal = function (options) {
        // 创建实体
        var uv = new uploaderVideo(this, options);
        // 调用其方法
        uv.init()
    }

})(jQuery, cobra, window, document);