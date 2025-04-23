// plugins/UpdatedAtPlugin.ts
import {
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type RootOperationNode,
  ColumnNode,
  ColumnUpdateNode,
  ValueNode,
} from 'kysely';

export class UpdatedAtPlugin implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const node = args.node;

    if (node.kind === 'UpdateQueryNode') {
      const updates = [...node.updates!];

      updates.push(ColumnUpdateNode.create(ColumnNode.create('updated_at'), ValueNode.create(new Date().toISOString())));

      return {
        ...node,
        updates,
      };
    }

    return node;
  }

  transformResult(args: PluginTransformResultArgs) {
    return Promise.resolve(args.result);
  }
}
