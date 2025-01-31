import { Button, Checkbox, message, Popover, Spin, Badge, Tooltip } from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useCopyToClipboard } from 'react-use';
import EntityInfo from '@/components/Common/GlobalComps/entityIcon';
import Information from './information';
import ForwardContentModal from './forwardContentModal';
import { showChatTime, downloadByUrl, shareOpenLink } from '@/utils/tools';
import { IMessage, ISession, MessageType } from '@/ts/core';
import { parseAvatar } from '@/ts/base';
import { parseCiteMsg, parseMsg, parseForwardMsg } from '../components/parseMsg';
import { RiShareForwardFill } from 'react-icons/ri';
import { BsListCheck } from 'react-icons/bs';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import {
  AiOutlineCopy,
  AiOutlineRollback,
  AiOutlineMessage,
  AiOutlineDelete,
  AiOutlineDownload,
  AiOutlineEllipsis,
} from 'react-icons/ai';
/**
 * @description: 聊天区域
 * @return {*}
 */

interface Iprops {
  chat: ISession;
  filter: string;
  handleReWrites: Function;
  /** 返回值，引用 */
  citeText: any;
  forward: any;
  multiSelectShow: boolean;
  multiSelectMsg: (item: IMessage, checked: boolean) => void;
  multiSelectFn: (multi: boolean) => void;
}

const GroupContent = (props: Iprops) => {
  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<IMessage>();
  const [messages, setMessages] = useState(props.chat.messages);
  const { handleReWrites, multiSelectShow } = props;
  const body = useRef<HTMLDivElement>(null);
  const [beforescrollHeight, setBeforescrollHeight] = useState(0);
  const [forwardModalOpen, setForwardModalOpen] = useState<boolean>(false); // 转发时用户
  const [forwardMessages, setForwardMessages] = useState<IMessage[]>([]);
  const [multiSelect, setMultiSelect] = useState(multiSelectShow);
  const [, copyToClipboard] = useCopyToClipboard();
  useEffect(() => {
    props.chat.onMessage((ms) => {
      setMessages([...ms]);
    });
    return () => {
      props.chat.unMessage();
    };
  }, [props.chat]);

  useEffect(() => {
    setMultiSelect(multiSelectShow);
  }, [multiSelectShow]);

  useEffect(() => {
    if (body && body.current) {
      if (loading) {
        setLoading(false);
        body.current.scrollTop = body.current.scrollHeight - beforescrollHeight;
      } else {
        body.current.scrollTop = body.current.scrollHeight;
      }
    }
  }, [messages]);

  const isShowTime = (curDate: string, beforeDate: string) => {
    if (beforeDate === '') return true;
    return moment(curDate).diff(beforeDate, 'minute') > 3;
  };
  // 滚动事件
  const onScroll = async () => {
    if (!loading && body.current && props.chat && body.current.scrollTop < 10) {
      setLoading(true);
      setBeforescrollHeight(body.current.scrollHeight);
      await props.chat.moreMessage();
      setMessages([...props.chat.messages]);
    }
  };

  const handleForwadModalClose = () => {
    setForwardModalOpen(false);
    setForwardMessages([]);
  };
  const viewForward = (item: IMessage[]) => {
    setForwardModalOpen(true);
    setForwardMessages(item);
  };

  const batchForwardMsg = (item: IMessage) => {
    // TODO 需要优化
    if (
      item.forward.length === 1 &&
      item.forward[0].forward &&
      item.forward[0].forward.length > 1
    ) {
      return (
        <React.Fragment>
          {parseForwardMsg(item.forward[0].forward, viewForward)}
        </React.Fragment>
      );
    }
    return <React.Fragment>{parseForwardMsg(item.forward, viewForward)}</React.Fragment>;
  };

  const showMsg = (item: IMessage) => {
    if (item.forward && item.forward.length) return batchForwardMsg(item);
    else return <React.Fragment>{parseMsg(item)}</React.Fragment>;
  };
  const viewMsg = (item: IMessage) => {
    if (item.isMySend) {
      return (
        <>
          <Popover
            autoAdjustOverflow={false}
            trigger="hover"
            key={item.id}
            placement="leftTop"
            getPopupContainer={(triggerNode: HTMLElement) => {
              return triggerNode.parentElement || document.body;
            }}
            overlayInnerStyle={{ marginRight: '-16px', padding: '3px' }}
            content={msgAction(item)}>
            <div className="flex">
              <div className="con_content">
                {props.chat.isBelongPerson ? (
                  <>
                    {showMsg(item)}
                    {item.cite && parseCiteMsg(item.cite)}
                  </>
                ) : (
                  <>
                    <Badge
                      key={item.id}
                      count={item.comments}
                      size="small"
                      style={{ zIndex: 2 }}
                      offset={[-15, -12]}>
                      {showMsg(item)}
                      {item.cite && parseCiteMsg(item.cite)}
                    </Badge>
                    <div
                      className={`information ${
                        item.readedinfo.includes('已读') ? 'readed' : ''
                      }`}
                      onClick={() => setInfoMsg(item)}>
                      {item.readedinfo}
                    </div>
                  </>
                )}
              </div>
              <div>
                <EntityInfo entityId={item.metadata.fromId} size={30} />
              </div>
            </div>
          </Popover>
        </>
      );
    } else {
      return (
        <>
          <div className="flex view_msg_gap">
            <div>
              <EntityInfo entityId={item.metadata.fromId} size={30} />
            </div>
            <div className={`con_content`}>
              <div className={`name`}>{item.from.name}</div>
              <Popover
                autoAdjustOverflow={false}
                trigger="hover"
                key={item.id}
                placement="rightTop"
                getPopupContainer={(triggerNode: HTMLElement) => {
                  return triggerNode.parentElement || document.body;
                }}
                overlayInnerStyle={{ marginLeft: '-18px', padding: '3px' }}
                content={msgAction(item)}>
                {showMsg(item)}
              </Popover>
              {item.cite && parseCiteMsg(item.cite)}
            </div>
          </div>
        </>
      );
    }
  };

  const loadMsgItem = (item: IMessage) => {
    return (
      <div
        className="con_body"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}>
        {multiSelect && (
          <Checkbox
            className="multiSelectStyl"
            onClick={(e) => {
              props.multiSelectMsg(
                item,
                (e as unknown as CheckboxChangeEvent).target.checked,
              );
            }}
          />
        )}
        {viewMsg(item)}
      </div>
    );
  };
  const handleMore = () => {
    setMultiSelect(true);
    props.multiSelectFn(true);
  };
  const moreAction = (item: IMessage) => {
    return (
      <div className="moreActionWrap">
        {props.chat.canDeleteMessage && (
          <Button
            type="text"
            className="multiBtn"
            onClick={async () => {
              if (await props.chat.deleteMessage(item.id)) {
                message.success('删除成功');
              }
            }}>
            <AiOutlineDelete size={19} className="actionIconStyl" />
            <span className="moreActionTxt">删除</span>
          </Button>
        )}
        <Button className="multiBtn" type="text" onClick={handleMore}>
          <BsListCheck size={19} className="actionIconStyl" />
          <span className="moreActionTxt">多选</span>
        </Button>
        {['文件', '视频', '图片'].includes(item.msgType) && item.forward?.length < 1 && (
          <Button
            type="text"
            className="multiBtn"
            onClick={() => {
              const url = parseAvatar(item.msgBody).shareLink;
              downloadByUrl(shareOpenLink(url, true));
            }}>
            <AiOutlineDownload size={19} className="actionIconStyl" />
            <span className="moreActionTxt">下载</span>
          </Button>
        )}
      </div>
    );
  };

  const msgAction = (item: IMessage) => {
    return (
      <div className="msgAction">
        <Tooltip title="复制">
          <AiOutlineCopy
            size={19}
            className="actionIconStyl"
            onClick={() => {
              copyToClipboard(item.msgBody);
              message.success('复制成功');
            }}
          />
        </Tooltip>
        <Tooltip title="引用">
          <AiOutlineMessage
            size={19}
            className="actionIconStyl"
            onClick={() => props.citeText(item)}
          />
        </Tooltip>
        <Tooltip title="转发">
          <RiShareForwardFill
            size={19}
            className="actionIconStyl"
            onClick={() => props.forward(item)}
          />
        </Tooltip>
        {item.isMySend && item.allowRecall && (
          <Tooltip title="撤回">
            <AiOutlineRollback
              size={19}
              className="actionIconStyl"
              onClick={async () => {
                await props.chat.recallMessage(item.id);
              }}
            />
          </Tooltip>
        )}
        {
          <Tooltip title="更多">
            <Popover
              placement="bottomRight"
              content={moreAction(item)}
              title=""
              trigger="click"
              overlayInnerStyle={{ marginTop: '-12px' }}>
              <AiOutlineEllipsis size={19} className="actionIconStyl" />
            </Popover>
          </Tooltip>
        }
      </div>
    );
  };

  const renderMessage = (item: IMessage) => {
    switch (item.msgType) {
      case MessageType.Recall:
        return (
          <div className="left-msg-body con recall">
            {item.msgBody}
            {item.allowEdit && (
              <span
                className="reWrite"
                onClick={() => {
                  handleReWrites(item.msgSource);
                }}>
                重新编辑
              </span>
            )}
          </div>
        );
      case MessageType.Notify:
        return <div className="left-msg-body con recall">{item.msgBody}</div>;
      default:
        if (item.isMySend) {
          return <div className="right-msg-body con">{loadMsgItem(item)}</div>;
        } else {
          return <div className="left-msg-body con">{loadMsgItem(item)}</div>;
        }
    }
  };

  return (
    <div className="msg-body" ref={body} onScroll={onScroll}>
      <Spin tip="加载中..." spinning={loading}>
        <div className="msg-body-warp">
          {messages
            .filter((i) => i.msgBody.includes(props.filter))
            .map((item, index: any) => {
              return (
                <React.Fragment key={item.id}>
                  {/* 聊天间隔时间3分钟则 显示时间 */}
                  {isShowTime(
                    item.createTime,
                    index > 0 ? messages[index - 1].createTime : '',
                  ) ? (
                    <div className="chat-space-time">
                      <span>{showChatTime(item.createTime)}</span>
                    </div>
                  ) : (
                    ''
                  )}
                  {renderMessage(item)}
                </React.Fragment>
              );
            })}
        </div>
        {infoMsg && <Information msg={infoMsg} onClose={() => setInfoMsg(undefined)} />}
      </Spin>
      <ForwardContentModal
        handleClose={handleForwadModalClose}
        open={forwardModalOpen}
        messages={forwardMessages}
        isBelongPerson={true}
        title={''}
        viewForward={viewForward}
      />
    </div>
  );
};
export default GroupContent;
