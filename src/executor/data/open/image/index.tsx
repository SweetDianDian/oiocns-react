import React from 'react';
import { Image } from 'antd';
import { FileItemModel } from '@/ts/base/model';
import FullScreenModal from '@/executor/tools/fullScreen';

interface IProps {
  share: FileItemModel;
  finished: () => void;
}

const ImageView: React.FC<IProps> = ({ share, finished }) => {
  if (share.shareLink) {
    if (!share.shareLink.includes('/orginone/anydata/bucket/load')) {
      share.shareLink = `/orginone/anydata/bucket/load/${share.shareLink}`;
    }
    return (
      <FullScreenModal
        centered
        open={true}
        width={'50vw'}
        destroyOnClose
        title={share.name}
        bodyHeight={'50vh'}
        onCancel={() => finished()}>
        <Image src={share.shareLink} preview={false} />
      </FullScreenModal>
    );
  }
  finished();
  return <></>;
};

export default ImageView;