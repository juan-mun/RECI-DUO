
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'generadora', 'recolectora');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  razon_social TEXT NOT NULL,
  nit TEXT NOT NULL,
  representante_legal TEXT NOT NULL,
  email_corporativo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Registration requests table
CREATE TABLE public.registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'correccion')),
  razon_social TEXT NOT NULL,
  nit TEXT NOT NULL,
  representante_legal TEXT NOT NULL,
  email_corporativo TEXT NOT NULL,
  telefono TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  numero_resolucion_licencia TEXT,
  autoridad_ambiental TEXT,
  admin_message TEXT,
  rejection_reason TEXT,
  allow_resubmit BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Registration documents table
CREATE TABLE public.registration_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.registration_requests(id) ON DELETE CASCADE NOT NULL,
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  is_required BOOLEAN DEFAULT true,
  validation_status TEXT DEFAULT 'pendiente' CHECK (validation_status IN ('pendiente', 'valido', 'invalido', 'requiere_correccion')),
  observation TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registration_documents ENABLE ROW LEVEL SECURITY;

-- Request actions log (timeline)
CREATE TABLE public.request_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.registration_requests(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.request_actions_log ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_registration_requests_updated_at BEFORE UPDATE ON public.registration_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile will be created during registration, not on signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: users can read their own roles, admins can read all
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- profiles: users can read/update own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- registration_requests: users can view/create own, admins can view/update all
CREATE POLICY "Users can view own requests" ON public.registration_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own requests" ON public.registration_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all requests" ON public.registration_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update requests" ON public.registration_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- registration_documents: users can view/create for own requests, admins can view/update all
CREATE POLICY "Users can view own documents" ON public.registration_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.registration_requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can upload own documents" ON public.registration_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.registration_requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "Admins can view all documents" ON public.registration_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update documents" ON public.registration_documents FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- request_actions_log: admins can read/write, users can read own request logs
CREATE POLICY "Users can view own request logs" ON public.request_actions_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.registration_requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "Admins can view all logs" ON public.request_actions_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert logs" ON public.request_actions_log FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for registration documents
INSERT INTO storage.buckets (id, name, public) VALUES ('registration-documents', 'registration-documents', false);

CREATE POLICY "Users can upload registration docs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'registration-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own registration docs" ON storage.objects FOR SELECT USING (
  bucket_id = 'registration-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all registration docs" ON storage.objects FOR SELECT USING (
  bucket_id = 'registration-documents' AND public.has_role(auth.uid(), 'admin')
);
