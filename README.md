# Лабораторна робота №5: Розширення бекенд-додатку та реалізація REST API

Цей репозиторій містить бекенд-частину для системи управління Ветеринарною клінікою. Проект реалізовано на стеку: **Node.js + Express + TypeORM + PostgreSQL**.

## 1. Реалізовані сутності та зв'язки

У проекті створено структуру бази даних, що відображає роботу клініки. Реалізовані наступні сутності:

* **Owner (Власник)** — зберігає контактні дані клієнтів.
    * *Зв'язок:* OneToMany з `Pet` (один власник — багато тварин).
* **Pet (Тварина)** — пацієнти клініки.
    * *Зв'язок:* ManyToOne з `Owner`.
    * *Зв'язок:* OneToMany з `Appointment` (історія візитів).
    * *Зв'язок:* OneToMany з `AnimalVaccination` (історія вакцинацій).
* **Employee (Лікар/Працівник)** — персонал клініки.
    * *Зв'язок:* OneToMany з `Appointment` (лікар проводить прийоми).
* **Appointment (Прийом)** — запис на візит.
    * *Зв'язки:* ManyToOne з `Pet` та `Employee`.
* **Payment (Оплата)** — фінансова транзакція.
    * *Зв'язок:* OneToOne з `Appointment` (один візит — один чек).
* **Medicines & Delivery** — складський облік ліків та їх поставок.
* **Vaccination** — довідник вакцин та журнал вакцинацій (`AnimalVaccination`).

---

## 2. API Ендпоінти

Реалізовано повноцінний CRUD для сутності **Owner** із використанням патерну *Controller-Service-Repository*.

| Метод  | URL          | Опис                                      |
| :---   | :---         | :---                                      |
| GET    | `/owners`    | Отримати всіх власників (включаючи тварин)|
| GET    | `/owners/:id`| Отримати власника за ID (включаючи тварин)|
| POST   | `/owners`    | Створити нового власника                  |
| PUT    | `/owners/:id`| Оновити дані власника                     |
| DELETE | `/owners/:id`| Видалити власника                         |

*Примітка: При запиті GET сервер автоматично підтягує зв'язані сутності (JOIN) з таблиці `pets`.*

---

## 3. Демонстрація роботи (Postman)

### 1. Створення нового власника (POST)
Успішне створення запису в базі даних.

<img width="957" height="696" alt="Opera Снимок_2025-11-22_114328_fawxxc-151247 postman co" src="https://github.com/user-attachments/assets/bc45f7f2-a078-442f-9390-20242fb731a1" />


### 2. Отримання списку власників (GET)
Демонстрація роботи **JOIN** (поле `pets` повертається разом з об'єктом власника).

 <img width="1431" height="777" alt="Opera Снимок_2025-11-22_113110_fawxxc-151247 postman co" src="https://github.com/user-attachments/assets/27f4c563-beab-4ba8-b978-9e44d8b031b5" />
 
### 3. Отримання власника за ID
<img width="956" height="676" alt="Opera Снимок_2025-11-22_114606_fawxxc-151247 postman co" src="https://github.com/user-attachments/assets/27985b8b-5e9b-4e26-9252-e4641b67c122" />

# Лабораторна робота №6: Рефакторинг архітектури (Validation, Service, DTO)

У цій лабораторній роботі було проведено рефакторинг бекенд-додатку з метою покращення його архітектури, безпеки та розділення відповідальності компонентів (Separation of Concerns).

## 1. Нова архітектура додатку

Проект розділено на чіткі шари, кожен з яких відповідає за свою частину обробки запиту:

* **Middleware (Валідація):**
    Цей шар виступає "фільтром" для вхідних даних. Він перехоплює HTTP-запит до того, як він дійде до контролера. Якщо дані некоректні (наприклад, невалідний email або відсутні обов'язкові поля), middleware повертає помилку `400 Bad Request` і зупиняє обробку.

* **Controller (Оркестрація):**
    Контролер більше не містить бізнес-логіки. Його завдання — прийняти об'єкт `Request`, передати дані у відповідний Сервіс, отримати результат, перетворити його у формат DTO та відправити клієнту об'єкт `Response`.

* **Service (Бізнес-логіка):**
    Основний шар логіки. Сервіс отримує "чисті" дані, виконує необхідні операції та взаємодіє з базою даних через Репозиторій. Сервіс не залежить від HTTP-протоколу.

* **Repository (Доступ до даних):**
    Шар TypeORM, який відповідає за безпосереднє виконання SQL-запитів до бази даних (збереження, пошук, видалення сутностей).

---

## 2. Приклади реалізації коду

### Middleware-функція (Валідація)
Приклад валідації при створенні власника. Перевіряється наявність обов'язкових полів та формат Email.

```typescript
export const validatorCreateOwner = (req: Request, res: Response, next: NextFunction) => {
  let { fullName, email, phone } = req.body;
  const errorsValidation: ErrorValidation[] = [];

  if (!email || !validator.isEmail(email)) {
    errorsValidation.push({ email: 'Email format is invalid' });
  }

  if (!fullName) {
    errorsValidation.push({ fullName: 'Full name is required' });
  }

  if (errorsValidation.length > 0) {
    const error = new CustomError(400, 'Validation', 'Create Owner validation error', null, null, errorsValidation);
    return next(error);
  }
  return next();
};
```
### Service Class (Бізнес-логіка)
Методи сервісу для створення та отримання власників. Сервіс інкапсулює логіку роботи з репозиторієм, ізолюючи її від контролера.

```typescript
export class OwnerService {
  async create(data: CreateOwnerDto) {
    const ownerRepository = getRepository(Owner);
    const newOwner = ownerRepository.create(data);
    return await ownerRepository.save(newOwner);
  }

  async getAll() {
    const ownerRepository = getRepository(Owner);
    return await ownerRepository.find({
      relations: ['pets'], 
    });
  }
  

}
```
### ResponseDTO (Трансформація відповіді)
Клас, який відповідає за фільтрацію даних перед відправкою клієнту. Він дозволяє приховати системні поля (`created_at`, `updated_at`) та гарантує, що клієнт отримає лише безпечні дані.

```typescript
export class OwnerResponseDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pets: any[]; 

  constructor(owner: Owner) {
    this.id = owner.id;
    this.fullName = owner.fullName;
    this.email = owner.email;
    this.phone = owner.phone;
    this.address = owner.address;
    this.pets = owner.pets;

  }
}
```
## 3. Демонстрація роботи (Postman)

### Скріншот 1: Помилка валідації (400 Bad Request)
Демонстрація роботи Middleware. При спробі відправити запит з некоректним email, сервер повертає помилку з описом проблеми та статус `400`.

<img width="745" height="774" alt="Opera Снимок_2025-11-22_122423_fawxxc-151247 postman co" src="https://github.com/user-attachments/assets/01d85dbd-09da-40e1-9653-170ca14ffd91" />


### Скріншот 2: Успішний запит (Response DTO)
Успішне отримання даних (`200 OK`). Відповідь сервера відформатована згідно з `OwnerResponseDto`: у JSON-об'єкті відсутні зайві системні поля (такі як `created_at`, `updated_at`), структура даних є чистою та безпечною.

<img width="726" height="479" alt="Opera Снимок_2025-11-22_122637_fawxxc-151247 postman co" src="https://github.com/user-attachments/assets/ae3e6bf8-9b41-4344-b99e-f1a809194c6c" />
