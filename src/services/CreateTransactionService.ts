import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);
    let category_id: string;
    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError(
        'you can not create an transaction with an outcome greater than your income',
        400,
      );
    }

    const findCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!findCategory) {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(newCategory);
      category_id = newCategory.id;
    } else {
      category_id = findCategory?.id;
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('The type should be income or outcome', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
