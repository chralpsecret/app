import log from 'loglevel';

export interface Application {
  id?: string;
  application_id?: string;
  status?: string;
  frist_name?: string;
  last_name?: string;
}

class Database {

  client:any;
  setDB(client: any): void {
    this.client = client;
  };

  async del(id: string): Promise<string> {
    const result = await this.client.del(id);
    return result;
  };

  async get(id: string): Promise<Application | string> {
    const result = await this.client.get(id);
    try {
      return JSON.parse(result)
    } catch (error) {
      return result;
    }
  };

  async set(key: string, entry: Application, opts: any = {}): Promise<boolean> {

    // ensure object is saved as string, if entry exists
    const _entry = !!entry ? JSON.stringify(entry) : {}
    await this.client.set(key, _entry, opts);

    // If opts.EX exists we want to set expire time on key
    if (opts?.EX) await this.client.expire(key, opts.EX);
    return true;
  };

  async publish({ channel, message }: any) {
    log.debug(`Publish to channel ${channel}, with message ${JSON.stringify(message)}`)
    return await this.client.publish(channel, JSON.stringify(message));
  };
};
// Export as singleton
export default new Database();
