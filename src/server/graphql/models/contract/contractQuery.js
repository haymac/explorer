import { GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";

import ContractSchema from "./contractSchema";
import { Contract } from "../../../database";
import { PAGE_SIZE } from "../../values";

export default {
  contract: {
    type: ContractSchema,
    args: {
      txid: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: (_source, { txid }) => {
      return Contract.findOne({ where: { txid } });
    }
  },
  contracts: {
    type: new GraphQLList(ContractSchema),
    args: {
      page: { type: GraphQLInt }
    },
    resolve: (_source, { page }) => {
      return Contract.findAll({
        offset: (Math.min(1, page || 1) - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        order: [["id", "asc"]]
      });
    }
  }
};
