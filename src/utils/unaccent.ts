import {
  OperationNodeTransformer,
  sql,
  type BinaryOperationNode,
  type KyselyPlugin,
  type PluginTransformQueryArgs,
  type PluginTransformResultArgs,
  type QueryId,
  type RawBuilder,
  type RootOperationNode,
} from 'kysely';

function wrapUnaccent(expr: RawBuilder<any>): RawBuilder<any> {
  return sql`unaccent(${expr})`;
}

class UnaccentTransformer extends OperationNodeTransformer {
  protected override transformBinaryOperation(node: BinaryOperationNode, queryId: QueryId): BinaryOperationNode {
    const transformed = super.transformBinaryOperation(node, queryId);

    // On n'applique unaccent que pour certains opérateurs textuels.
    const operator = transformed.operator as unknown as string;
    const textOperators = ['=', 'like', 'ilike'];
    if (!textOperators.includes(operator)) {
      return transformed;
    }

    return {
      ...transformed,
      leftOperand: wrapUnaccent(transformed.leftOperand as any) as any,
      rightOperand: wrapUnaccent(transformed.rightOperand as any) as any,
    };
  }
}

const unaccentPlugin: KyselyPlugin = {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    const transformer = new UnaccentTransformer();
    return transformer.transformNode(args.node, args.queryId);
  },

  async transformResult(args: PluginTransformResultArgs) {
    return args.result;
  },
};

export default unaccentPlugin;
