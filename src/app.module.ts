// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BearerTokenModule } from './modules/auth/bearer-token.module';
import { LoggingModule } from './modules/logging/logging.module';
import { SqlMigrationModule } from './modules/sql-migration/sql-migration.module';
import { SqlModule } from './modules/sql/sql.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Enable auto schema sync (disable in production)
    }),
    LoggingModule,
    BearerTokenModule,
    SqlModule,
    SqlMigrationModule,
    // Import additional modules (like ExampleModule) as needed.
  ],
})
export class AppModule {}
