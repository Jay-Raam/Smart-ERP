import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';
import { pool } from '../config/database';
import { createDataLoaders } from './dataloaders';
import { PoolClient } from 'pg';
import { TenantContext } from '../middleware/tenantResolver';
import { UserPayload } from '../security/auth';

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export interface GraphQLContext {
  req: any;
  tenant?: TenantContext;
  user?: UserPayload;
  pgClient?: PoolClient;
  loaders: ReturnType<typeof createDataLoaders>;
}

export const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: '/graphql',
  context: async ({ req }: any) => {
    let pgClient: PoolClient | undefined;

    try {
      // 1. Acquire dedicated client from pool for transaction/schema isolation
      pgClient = await pool.connect();

      // 2. Lease tenant schema isolation if tenant is present
      if (req.tenant?.schemaName) {
        await pgClient.query(`SET search_path TO "${req.tenant.schemaName}", public`);
      }
    } catch {
      pgClient = undefined;
    }

    // Release client back to pool on request completion
    if (pgClient) {
      req.on?.('close', () => {
        try {
          pgClient?.release();
        } catch {}
      });
    }

    const loaders = createDataLoaders(pgClient);

    return {
      req,
      tenant: req.tenant,
      user: req.user,
      pgClient,
      loaders,
    };
  },
});
