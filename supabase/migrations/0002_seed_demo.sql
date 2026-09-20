-- Demo data loader. Call from the app (button on the overview) to fill an
-- account with the same numbers the trial version showed, so the team can try
-- the flow before real leads arrive. Idempotent: does nothing if the account
-- already has leads. Runs as the caller (RLS applies), so it only ever touches
-- an account the user belongs to.

create or replace function public.seed_demo_data(aid uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  ad_a uuid; ad_b uuid; ad_c uuid;
  obj_price uuid; obj_timing uuid; obj_competitor uuid;
  yasmin uuid; rana uuid;
begin
  if not public.is_account_member(aid) then
    raise exception 'not a member of this account';
  end if;
  if exists (select 1 from public.leads where account_id = aid) then
    return; -- already seeded
  end if;

  insert into public.ads (account_id, name, spend) values
    (aid, 'فيديو شرح الخدمة', 1200) returning id into ad_a;
  insert into public.ads (account_id, name, spend) values
    (aid, 'تجربة عميل سابق', 900) returning id into ad_b;
  insert into public.ads (account_id, name, spend) values
    (aid, 'تفاصيل العرض', 600) returning id into ad_c;

  insert into public.objections (account_id, label, suggested_angle) values
    (aid, 'السعر عالي', 'زاوية: خطط تقسيط + مقارنة القيمة مقابل السعر') returning id into obj_price;
  insert into public.objections (account_id, label, suggested_angle) values
    (aid, 'التوقيت مش مناسب', 'زاوية: عرض محدود المدة + خصم للحجز المبكر') returning id into obj_timing;
  insert into public.objections (account_id, label, suggested_angle) values
    (aid, 'بيقارن بمنافس', 'زاوية: جدول مقارنة يوضّح الفرق + ضمان') returning id into obj_competitor;

  -- Ad A: 6 leads → 1 won (3500), 4 qualified, 1 lost
  insert into public.leads (account_id, ad_id, full_name, phone, status, value, objection_id) values
    (aid, ad_a, 'أحمد مصطفى', '+201000000001', 'won', 3500, null),
    (aid, ad_a, 'سارة علي', '+201000000002', 'qualified', null, null),
    (aid, ad_a, 'محمود حسن', '+201000000003', 'in_progress', null, obj_timing),
    (aid, ad_a, 'ليلى فؤاد', '+201000000004', 'qualified', null, null),
    (aid, ad_a, 'كريم سمير', '+201000000005', 'in_progress', null, obj_price),
    (aid, ad_a, 'هالة نبيل', '+201000000006', 'lost', null, obj_competitor);

  -- Ad B: 6 leads → 2 won (5000 + 4600), 3 qualified, 1 lost
  insert into public.leads (account_id, ad_id, full_name, phone, status, value, objection_id) values
    (aid, ad_b, 'ياسمين تامر', '+201000000007', 'won', 5000, null) returning id into yasmin;
  insert into public.leads (account_id, ad_id, full_name, phone, status, value, objection_id) values
    (aid, ad_b, 'عمر خالد', '+201000000008', 'won', 4600, null),
    (aid, ad_b, 'نورا وليد', '+201000000009', 'qualified', null, null),
    (aid, ad_b, 'يوسف عادل', '+201000000010', 'in_progress', null, obj_timing),
    (aid, ad_b, 'دينا رأفت', '+201000000011', 'qualified', null, null),
    (aid, ad_b, 'طارق فتحي', '+201000000012', 'lost', null, obj_price);

  -- Ad C: 6 leads → 1 won (5000), 2 qualified, 3 lost
  insert into public.leads (account_id, ad_id, full_name, phone, status, value, objection_id) values
    (aid, ad_c, 'منى شعبان', '+201000000013', 'won', 5000, null),
    (aid, ad_c, 'رنا شريف', '+201000000014', 'lost', null, obj_price) returning id into rana;
  insert into public.leads (account_id, ad_id, full_name, phone, status, value, objection_id) values
    (aid, ad_c, 'باسم جمال', '+201000000015', 'qualified', null, null),
    (aid, ad_c, 'إيمان صبري', '+201000000016', 'in_progress', null, obj_competitor),
    (aid, ad_c, 'حسام الدين', '+201000000017', 'lost', null, obj_timing),
    (aid, ad_c, 'شيماء رضا', '+201000000018', 'lost', null, obj_competitor);

  -- Activity feed
  insert into public.lead_events (account_id, lead_id, type, value, created_at) values
    (aid, yasmin, 'qualified', null, now() - interval '3 hours'),
    (aid, yasmin, 'won', 5000, now() - interval '1 hour'),
    (aid, rana, 'qualified', null, now() - interval '5 hours'),
    (aid, rana, 'lost', null, now() - interval '2 hours');
end;
$$;
