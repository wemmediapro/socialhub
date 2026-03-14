import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar, dayjsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import dayjs from "dayjs";

const localizer = dayjsLocalizer(dayjs);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DnDCalendar = withDragAndDrop(Calendar as any);

type Post = {
  _id: string;
  projectId: string;
  network: string;
  type: string;
  caption: string;
  scheduledAt: string;
  status: string;
};

export default function CalendarPro() {
  const [posts, setPosts] = useState<Post[]>([]);
  const events = useMemo(() => posts.map(p => ({
    id: p._id,
    title: `${p.network} • ${p.type}`,
    start: new Date(p.scheduledAt),
    end: new Date(new Date(p.scheduledAt).getTime() + 30*60*1000)
  })), [posts]);

  const load = async () => {
    const r = await axios.get("/api/posts");
    // Only show SCHEDULED posts in calendar
    const scheduledPosts = r.data.posts.filter((p: Post) => p.status === 'SCHEDULED' || p.status === 'PUBLISHED');
    setPosts(scheduledPosts);
  };
  useEffect(() => { load(); }, []);

  const onEventDrop = async ({ event, start, end, allDay }: any) => {
    await axios.patch(`/api/posts/${event.id}`, { scheduledAt: start });
    await load();
  };

  const onEventResize = async ({ event, start, end }: any) => {
    await axios.patch(`/api/posts/${event.id}`, { scheduledAt: start });
    await load();
  };

  return (
    <main style={{ padding: 12, fontFamily: "sans-serif", height: "100vh" }}>
      <h1>Calendrier Pro (glisser-déposer)</h1>
      <DnDCalendar
        defaultView="week"
        localizer={localizer}
        events={events}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        style={{ height: "90%" }}
      />
    </main>
  );
}
