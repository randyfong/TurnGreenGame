import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { ToolGateway } from '../shared/types';
const folders = {simulation:'simulate_policy_turn',science:'get_scientific_explaination',assessment:'assessment_delta',resolution:'resolution_generator'};
export class MCPGateway implements ToolGateway {
  private clients = new Map<string, Promise<Client>>();
  async call(server:keyof typeof folders, name:string, args:Record<string,unknown>) {
    let pending = this.clients.get(server);
    if (!pending) {
      pending = (async () => {
        const root = process.env.TURNGREEN_MCP_ROOT ?? fileURLToPath(new URL('../../TurnGreen/MCP/', import.meta.url));
        const entry = process.env[`TURNGREEN_${server.toUpperCase()}_ENTRY`] ?? path.join(root, folders[server], 'dist/index.js');
        const transport = new StdioClientTransport({command:process.execPath,args:[entry],stderr:'inherit'});
        const client = new Client({name:'cooltown-web',version:'0.1.0'});
        try { await client.connect(transport); } catch (error) { await transport.close().catch(()=>{}); throw error; }
        return client;
      })();
      this.clients.set(server,pending);
    }
    let client:Client;
    try { client = await pending; } catch(error) { this.clients.delete(server); throw error; }
    const result = await client.callTool({name,arguments:args}, undefined, {timeout:30000});
    if(!Array.isArray(result.content)) throw new Error(`${name} returned an invalid MCP envelope`);
    const text = result.content.filter((c:unknown):c is {type:'text';text:string}=>typeof c==='object'&&c!==null&&'type' in c&&c.type==='text'&&'text' in c&&typeof c.text==='string').map(c=>c.text).join('\n');
    if(result.isError) throw new Error(text || `${name} failed`);
    try { return JSON.parse(text); } catch { throw new Error(`${name} returned invalid JSON`); }
  }
  async close() { await Promise.allSettled([...this.clients.values()].map(async p=>(await p).close())); this.clients.clear(); }
}
