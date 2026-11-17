import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-slate-900">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                    <Link to="/" className="text-2xl font-bold tracking-tight text-indigo-600">
                        TeamOrbit<span className="text-slate-900">.</span>
                    </Link>

                    <div className="hidden items-center gap-8 md:flex">
                        <a href="#home" className="text-sm font-medium hover:text-indigo-600">Home</a>
                        <a href="#features" className="text-sm font-medium hover:text-indigo-600">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium hover:text-indigo-600">How It Works</a>
                        <a href="#pricing" className="text-sm font-medium hover:text-indigo-600">Pricing</a>
                        <a href="#about" className="text-sm font-medium hover:text-indigo-600">About</a>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="hidden rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-100 sm:block"
                        >
                            Login
                        </Link>

                        <Link
                            to="/register"
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Get Started
                        </Link>
                    </div>

                </div>
            </nav>

            {/* Hero */}
            <section id="home" className="overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">

                    <div>
                        <span className="inline-block rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                            One Platform. Every Team.
                        </span>

                        <h1 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Manage Your Team.
                            <span className="block text-indigo-600">
                                Achieve More Together.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Simplify project management, organize tasks, track
                            employee performance and bring your entire team
                            together with TeamOrbit.
                        </p>

                        <div className="mt-9 flex flex-wrap gap-4">
                            <Link
                                to="/register"
                                className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-1 hover:bg-indigo-700"
                            >
                                Start Your Workspace →
                            </Link>

                            <a
                                href="#features"
                                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold transition hover:bg-slate-50"
                            >
                                Explore Features
                            </a>
                        </div>

                        <p className="mt-6 text-sm text-slate-500">
                            Built for modern teams and growing businesses.
                        </p>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-indigo-100">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                            <div>
                                <h3 className="font-bold">Workspace Overview</h3>
                                <p className="mt-1 text-xs text-slate-500">Your team's activity at a glance</p>
                            </div>
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Live Preview
                            </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-4">
                            {[
                                ['Total Projects', '24', '↗ 12%'],
                                ['Team Members', '48', 'Active team'],
                                ['Completed Tasks', '186', '↗ 18%'],
                                ['Pending Tasks', '32', 'In progress']
                            ].map(([title, value, info]) => (
                                <div key={title} className="rounded-xl bg-slate-50 p-5">
                                    <p className="text-sm text-slate-500">{title}</p>
                                    <h3 className="mt-2 text-3xl font-bold">{value}</h3>
                                    <p className="mt-2 text-xs font-medium text-indigo-600">{info}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 rounded-xl bg-indigo-50 p-5">
                            <div className="flex justify-between">
                                <span className="font-semibold">Project Progress</span>
                                <span className="font-bold text-indigo-600">75%</span>
                            </div>
                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-indigo-100">
                                <div className="h-full w-3/4 rounded-full bg-indigo-600"></div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                Keep your projects moving forward.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="mx-auto max-w-7xl px-6 py-24">

                <div className="mx-auto max-w-2xl text-center">
                    <span className="font-semibold text-indigo-600">OUR FEATURES</span>
                    <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Everything Your Team Needs
                    </h2>
                    <p className="mt-5 leading-7 text-slate-600">
                        Powerful tools to help your organization stay
                        productive, organized and connected.
                    </p>
                </div>

                <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">

                    {[
                        {
                            icon: '📋',
                            title: 'Task Management',
                            description: 'Create, assign and track tasks with clear priorities and deadlines.'
                        },
                        {
                            icon: '📊',
                            title: 'Project Tracking',
                            description: 'Monitor project progress and keep every important activity organized.'
                        },
                        {
                            icon: '👥',
                            title: 'Team Management',
                            description: 'Manage employees, responsibilities and team activities in one place.'
                        },
                        {
                            icon: '📈',
                            title: 'Analytics',
                            description: 'Understand productivity and monitor performance through insights.'
                        }
                    ].map((feature) => (
                        <div
                            key={feature.title}
                            className="rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl"
                        >
                            <div className="text-4xl">{feature.icon}</div>
                            <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}

                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="bg-slate-50 px-6 py-24">
                <div className="mx-auto max-w-7xl">

                    <div className="text-center">
                        <span className="font-semibold text-indigo-600">GET STARTED</span>
                        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                            Get Your Team Organized in 3 Steps
                        </h2>
                    </div>

                    <div className="mt-14 grid gap-10 md:grid-cols-3">

                        {[
                            ['01', 'Create Your Workspace', 'Register your organization and create your company workspace.'],
                            ['02', 'Build Your Team', 'Invite employees and organize your team responsibilities.'],
                            ['03', 'Manage & Grow', 'Create projects, assign tasks and track your progress.']
                        ].map(([number, title, description]) => (
                            <div key={number} className="text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
                                    {number}
                                </div>
                                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                                <p className="mt-3 leading-7 text-slate-600">{description}</p>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="mx-auto max-w-7xl px-6 py-24">

                <div className="text-center">
                    <span className="font-semibold text-indigo-600">PRICING</span>
                    <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Simple Plans for Growing Teams
                    </h2>
                    <p className="mt-4 text-slate-600">
                        Choose the right plan for your organization.
                    </p>
                </div>

                <div className="mx-auto mt-14 max-w-md rounded-2xl border-2 border-indigo-600 p-8 shadow-xl">

                    <span className="rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                        Coming Soon
                    </span>

                    <h3 className="mt-6 text-2xl font-bold">TeamOrbit Pro</h3>

                    <p className="mt-3 text-slate-600">
                        Advanced team and project management for growing organizations.
                    </p>

                    <ul className="mt-7 space-y-4 text-sm text-slate-700">
                        <li>✓ Organization workspace</li>
                        <li>✓ Employee management</li>
                        <li>✓ Project and task management</li>
                        <li>✓ Productivity analytics</li>
                        <li>✓ Dedicated company workspace</li>
                    </ul>

                    <Link
                        to="/register"
                        className="mt-9 block rounded-xl bg-indigo-600 px-6 py-3.5 text-center font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Get Started
                    </Link>

                </div>
            </section>

            {/* About */}
            <section id="about" className="bg-indigo-600 px-6 py-20 text-white">
                <div className="mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl">
                        Better Collaboration Starts Here.
                    </h2>
                    <p className="mx-auto mt-6 max-w-2xl leading-8 text-indigo-100">
                        TeamOrbit brings people, projects and tasks together.
                        Our goal is to help organizations simplify their
                        workflows and accomplish more through better teamwork.
                    </p>
                    <Link
                        to="/register"
                        className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    >
                        Create Your Workspace →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 px-6 py-10 text-white">
                <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row">

                    <div>
                        <h2 className="text-2xl font-bold">
                            TeamOrbit<span className="text-indigo-400">.</span>
                        </h2>
                        <p className="mt-3 text-sm text-slate-400">
                            Manage your team. Achieve more together.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                        <a href="#home" className="hover:text-white">Home</a>
                        <a href="#features" className="hover:text-white">Features</a>
                        <a href="#pricing" className="hover:text-white">Pricing</a>
                        <Link to="/login" className="hover:text-white">Login</Link>
                    </div>

                </div>

                <div className="mx-auto mt-10 max-w-7xl border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} TeamOrbit. All rights reserved.
                </div>
            </footer>

        </div>
    );
}