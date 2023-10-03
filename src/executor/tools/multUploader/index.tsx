import React, { useEffect, useState } from 'react';
import cls from './index.module.less';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload, UploadProps } from 'antd';
import { IDirectory, ISysFileInfo } from '@/ts/core';
import ActivityResource from '@/components/Activity/ActivityResource';
import orgCtrl from '@/ts/controller';
const ImageUploader: React.FC<{
  maxCount: number;
  types: string[];
  directory: IDirectory;
  onChange: (fileList: ISysFileInfo[]) => void;
}> = (props) => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<ISysFileInfo[]>([]);
  useEffect(() => {
    const files: ISysFileInfo[] = [];
    orgCtrl.user.copyFiles.forEach((item) => {
      if ('filedata' in item) {
        const file = item as ISysFileInfo;
        if (props.types.some((i) => file.filedata.contentType?.startsWith(i))) {
          files.push(file);
        }
      }
    });
    setFileList(files);
    props.onChange(files);
  }, []);
  const directory = props.directory;
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>{loading ? '正在上传' : '选择文件'}</div>
    </div>
  );

  const uploadProps: UploadProps = {
    multiple: true,
    maxCount: props.maxCount,
    showUploadList: false,
    beforeUpload: (file) => {
      setLoading(true);
      if (!props.types.some((i) => file.type.startsWith(i))) {
        message.error(`${file.name} 是不支持的格式`);
        return false;
      }
      return true;
    },
    async customRequest(options) {
      const file = options.file as File;
      if (file) {
        const result = await directory.createFile(file);
        result && fileList.push(result);
        setFileList(fileList);
        props.onChange(fileList);
      }
      setLoading(false);
    },
  };
  return (
    <div className={cls.imageUploader}>
      {ActivityResource(
        fileList.map((i) => i.shareInfo()),
        200,
        1,
      )}
      <Upload listType="picture-card" {...uploadProps}>
        {fileList.length >= props.maxCount ? null : uploadButton}
      </Upload>
    </div>
  );
};

export default ImageUploader;
