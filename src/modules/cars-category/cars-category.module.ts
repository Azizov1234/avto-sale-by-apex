import { Module } from '@nestjs/common';
import { CarsCategoryService } from './cars-category.service';
import { CarsCategoryController } from './cars-category.controller';

@Module({
  controllers: [CarsCategoryController],
  providers: [CarsCategoryService],
})
export class CarsCategoryModule {}
