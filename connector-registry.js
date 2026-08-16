const BUILTIN_TEMPLATES=[
  {id:'email',name:'Email',category:'communication',description:'Connect an approved email MCP/API service to draft or send messages.',sensitive:['send','submit']},
  {id:'calendar',name:'Calendar',category:'planning',description:'Connect an approved calendar MCP/API service to inspect or create events.',sensitive:['create','edit','delete']},
  {id:'messaging',name:'Messaging',category:'communication',description:'Connect an approved messaging MCP/API service to draft or send messages.',sensitive:['send']},
  {id:'calling',name:'Calling',category:'communication',description:'Connect an approved calling MCP/API service to place calls.',sensitive:['call']},
  {id:'crm',name:'CRM',category:'business',description:'Connect an approved CRM MCP/API service to search or update records.',sensitive:['create','edit','delete']},
  {id:'files',name:'Files and documents',category:'productivity',description:'Connect an approved file/document MCP/API service to search, read, or create files.',sensitive:['create','delete']},
  {id:'project',name:'Project management',category:'productivity',description:'Connect an approved project-management MCP/API service to inspect or update work items.',sensitive:['create','edit','delete']}
];
function normalizeConnector(raw={}){return {id:String(raw.id||raw.name||'connector').toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:String(raw.name||'Unnamed connector'),category:String(raw.category||'custom'),endpoint:String(raw.endpoint||''),enabled:raw.enabled!==false,status:raw.status||'not-configured',tools:Array.isArray(raw.tools)?raw.tools:[],lastChecked:raw.lastChecked||null}}
function listConnectors(items=[]){return items.map(normalizeConnector)}
function health(connector){const c=normalizeConnector(connector);return {id:c.id,name:c.name,enabled:c.enabled,configured:Boolean(c.endpoint),status:c.enabled&&c.endpoint?'ready':c.enabled?'needs-setup':'disabled',toolCount:c.tools.length,lastChecked:new Date().toISOString()}}
function discoverTools(connector,tools=[]){const c=normalizeConnector(connector);return {connector:c.id,tools:tools.map(t=>({name:String(t.name||'unknown'),description:String(t.description||''),sensitive:Boolean(t.sensitive),available:t.available!==false}))}}
module.exports={BUILTIN_TEMPLATES,normalizeConnector,listConnectors,health,discoverTools};
