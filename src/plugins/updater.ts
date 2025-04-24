import {
  ColumnNode,
  ColumnUpdateNode,
  ValueNode,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryResult,
  type RootOperationNode,
  type UnknownRow,
} from 'kysely';
import { Database } from 'kysely-orm';

class UpdatedAtPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const node = args.node;
    if (node.kind === 'UpdateQueryNode' && node.updates && node.updates.length > 0) {
      const updates: ColumnUpdateNode[] = [...node.updates!];

      updates.push(ColumnUpdateNode.create(ColumnNode.create('updated_at'), ValueNode.create(new Date().toISOString())));

      return { ...node, updates };
    }
    return args.node;
  }

  transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result);
  }
}

export class AppDatabase<DB> extends Database<DB> {
  constructor(options: any) {
    const plugins = [...(options.plugins ?? []), new UpdatedAtPlugin()];
    super({ ...options, plugins });
  }
}
