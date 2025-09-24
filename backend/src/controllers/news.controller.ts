import { Request, Response } from 'express';
import { prisma } from '../config/database.js';

export const getAllNews = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 5, search, fromDate, toDate } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (fromDate || toDate) {
      where.publishedAt = {};
      if (fromDate) where.publishedAt.gte = new Date(fromDate as string);
      if (toDate) where.publishedAt.lte = new Date(toDate as string);
    }

    const news = await prisma.news.findMany({
      where,
      orderBy: {
        publishedAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const total = await prisma.news.count({ where });

    res.json({
      news,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNewsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsItem = await prisma.news.findUnique({
      where: { id },
    });
    if (!newsItem) {
      return res.status(404).json({ error: 'News not found' });
    }
    res.json(newsItem);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, description, content, imageUrl } = req.body;
    const newsItem = await prisma.news.create({
      data: {
        title,
        description,
        content,
        imageUrl,
      },
    });
    res.status(201).json(newsItem);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
