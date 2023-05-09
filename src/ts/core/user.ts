import { common, kernel, model, schema } from '../base';
import { Emitter } from '../base/common';
import { XWorkTask } from '../base/schema';
import { TargetType } from './public/enums';
import { IPerson, Person } from './target/person';
import { IWorkProvider, WorkProvider } from './work/provider';
const sessionUserName = 'sessionUser';

// 消息变更推送
export const workNotify = new Emitter();
export class UserProvider extends common.Emitter {
  private _user: IPerson | undefined;
  private _work: IWorkProvider | undefined;
  private _inited: boolean = false;
  private _preMessages: model.MsgSaveModel[] = [];
  constructor() {
    super();
    kernel.on('RecvMsg', (data) => {
      if (this._inited) {
        this._recvMessage(data);
      } else {
        this._preMessages.push(data);
      }
    });
    kernel.on('RecvTask', (data: XWorkTask) => {
      if (this._inited && this._work) {
        this._work.updateTask(data);
      }
    });
    const userJson = sessionStorage.getItem(sessionUserName);
    if (userJson && userJson.length > 0) {
      this._loadUser(JSON.parse(userJson));
    }
  }
  /** 当前用户 */
  get user(): IPerson | undefined {
    return this._user;
  }
  /** 办事提供层 */
  get work(): IWorkProvider | undefined {
    return this._work;
  }
  /** 是否完成初始化 */
  get inited(): boolean {
    return this._inited;
  }
  /**
   * 登录
   * @param account 账户
   * @param password 密码
   */
  public async login(account: string, password: string): Promise<model.ResultType<any>> {
    let res = await kernel.login(account, password);
    if (res.success) {
      await this._loadUser(res.data.target);
    }
    return res;
  }
  /**
   * 注册用户
   * @param {RegisterType} params 参数
   */
  public async register(params: model.RegisterType): Promise<model.ResultType<any>> {
    let res = await kernel.register(params);
    if (res.success) {
      await this._loadUser(res.data.target);
    }
    return res;
  }
  /**
   * 变更密码
   * @param account 账号
   * @param password 密码
   * @param privateKey 私钥
   * @returns
   */
  public async resetPassword(
    account: string,
    password: string,
    privateKey: string,
  ): Promise<model.ResultType<any>> {
    return await kernel.resetPassword(account, password, privateKey);
  }
  /** 加载用户 */
  private _loadUser(person: schema.XTarget) {
    sessionStorage.setItem(sessionUserName, JSON.stringify(person));
    this._user = new Person(person);
    this._work = new WorkProvider(this._user);
    this.changCallback();
  }
  /** 更新用户 */
  public update(person: schema.XTarget) {
    sessionStorage.setItem(sessionUserName, JSON.stringify(person));
  }
  /** 重载数据 */
  public async refresh(): Promise<void> {
    this._inited = false;
    await this._user?.deepLoad(true);
    await this.work?.loadTodos(true);
    this._inited = true;
    this._preMessages = this._preMessages
      .sort((a, b) => {
        return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
      })
      .filter((item) => {
        this._recvMessage(item);
        return false;
      });
  }
  /**
   * 接收到新信息
   * @param data 新消息
   * @param cache 是否缓存
   */
  private _recvMessage(data: model.MsgSaveModel): void {
    for (const c of this._user?.chats || []) {
      let isMatch = data.sessionId === c.chatId;
      if (
        (c.share.typeName === TargetType.Person || c.share.typeName === '权限') &&
        isMatch
      ) {
        isMatch = data.belongId == c.belongId;
      }
      if (isMatch) {
        c.receiveMessage(data);
      }
    }
  }
}
