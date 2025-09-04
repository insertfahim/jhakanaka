
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ChatInterface from '@/components/ChatInterface';
import Forum from '@/components/Forum';
import Calendar from '@/components/Calendar';
import Poll from '@/components/Poll';

interface Member {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  courseCode: string;
  courseName: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Member[];
  _count: {
    members: number;
  };
}

export default function GroupPage() {
  const params = useParams();
  const { id } = params;
  const { data: session } = useSession();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !session) return;

    const fetchGroup = async () => {
      try {
        const response = await fetch(`/api/groups/${id}`);
        if (response.ok) {
          const data = await response.json();
          setGroup(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch group');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [id, session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!group) {
    return <div>Group not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{group.name}</h1>
      <p className="text-lg text-gray-600 mb-2">{group.courseCode} - {group.courseName}</p>
      <p className="mb-4">{group.description}</p>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Owner</h2>
        <p>{group.owner.name} ({group.owner.email})</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold">Members ({group._count.members})</h2>
        <ul>
          {group.members.map((member) => (
            <li key={member.user.id}>
              {member.user.name} ({member.user.email})
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-8">
        <ChatInterface groupId={group.id} groupName={group.name} />
        <Forum groupId={group.id} groupName={group.name} />
        <Calendar groupId={group.id} groupName={group.name} />
        <Poll groupId={group.id} groupName={group.name} />
      </div>
    </div>
  );
}
