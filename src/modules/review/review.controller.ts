import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/role';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('reviews')
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateReviewDto, @Req() req) {
    return this.reviewService.create(dto, req.user.id);
  }

  @Get('reviews/my')
  @UseGuards(AuthGuard)
  findMy(@Req() req, @Query() query: QueryReviewDto) {
    return this.reviewService.findMy(req.user.id, query);
  }

  @Patch('reviews/:id')
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
    @Req() req,
  ) {
    return this.reviewService.update(id, dto, req.user);
  }

  @Delete('reviews/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.reviewService.remove(id, req.user);
  }

  @Get('cars/:id/reviews')
  findByCar(
    @Param('id', ParseIntPipe) carId: number,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewService.findByCar(carId, query);
  }

  @Get('cars/:id/average-rating')
  getAverageRating(@Param('id', ParseIntPipe) carId: number) {
    return this.reviewService.getAverageRating(carId);
  }

  @Get('reviews')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  findAll(@Query() query: QueryReviewDto) {
    return this.reviewService.findAll(query);
  }
}
