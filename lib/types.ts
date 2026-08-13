export type Booth = {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  helper: string;
  emoji: string;
};

export type Passport = {
  id: string;
  firstName: string;
  studentId: string;
  className: string;
  createdAt: string;
};

export type Stamp = {
  booth_slug: string;
  confirmed_at: string;
};
