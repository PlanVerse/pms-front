"use client";

import DetailModal from "@/components/DetailModal";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getAvatarFallback } from "@/lib/avatar";
import { getApi, putApi } from "@/lib/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
// import { teamListMock } from "@/mock/team";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const teamDetailSchema = z.object({
    teamName: z.string(),
    teamDescription: z.string().max(100),
    // teamMembers: z.array(z.object({
    //     id: z.string(),
    //     username: z.string(),
    //     profileImageUrl: z.string()
    // }))
})

const TeamTable = ({
    list,
    setDetailModalIsOpen,
    setSelectedTeam
}) => {
    const handleDetailModal = async (teamId) => {
        setIsCreator(isCreator);
        const requestTeamDetail = await getApi(`${process.env.NEXT_PUBLIC_API_URL}/team/info/${teamId}`, null, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        setDetailModalTeam(requestTeamDetail.data);
    };

    return (
        <div className="border rounded-md overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow className="bg-gray-100">
                    <TableHead className="text-center border-r">
                        팀 이름
                    </TableHead>
                    <TableHead className="text-center border-r">
                        설명
                    </TableHead>
                    <TableHead className="text-center">
                        팀원
                    </TableHead>
                    <TableHead className="w-32 text-center"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {list.map((team) => (
                    <TableRow key={team.id}>
                        <TableCell className="text-center border-r">
                            {team.name}
                        </TableCell>
                        <TableCell className="text-center border-r">
                            {team.description}
                        </TableCell>
                        <TableCell className="text-center flex">
                            {team.teamMemberInfos && team.teamMemberInfos.length > 0 && team.teamMemberInfos.map((member, index) => (
                                <div key={`${member.id}_${index}`} className={`w-10 h-10 text-sm border border-gray-400 rounded-full flex items-center justify-center font-semibold`}>
                                    {getAvatarFallback(member.username)}
                                </div>
                            ))}
                        </TableCell>
                        <TableCell className="w-32 text-center">
                            <Button
                                variant="outline"
                                className="bg-primary-500 text-white px-3"
                                onClick={() => {
                                    setSelectedTeam(team);
                                    setDetailModalIsOpen(true);
                                }}
                            >
                                상세정보
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default function TeamListPage({ token }) {
    const [isLoading, setIsLoading] = useState(true);
    const [createdTeamList, setCreatedTeamList] = useState([]);
    const [joinedTeamList, setJoinedTeamList] = useState([]);
    const [detailModalIsOpen, setDetailModalIsOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMember, setTeamMember] = useState("");
    const [members, setMembers] = useState([]);

    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(teamDetailSchema),
        defaultValues: {
            teamName: "",
            teamDescription: ""
        }
    });

    function addMember() {
        setTeamMember("");
        if (members.includes(teamMember)) {
            return;
        }
        setMembers([...members, teamMember]);
    };

    async function onSubmit(values) {
        try {
            await putApi(`${process.env.NEXT_PUBLIC_API_URL}/team/info`, {
                teamId: selectedTeam.id,
                name: values.teamName || selectedTeam.name,
                description: values.teamDescription || selectedTeam.description,
                invite: members.filter((member) => !selectedTeam.teamMemberInfos.find((m) => m.email === member)),
                exclude: members.filter((member) => selectedTeam.teamMemberInfos.find((m) => m.email === member))
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setDetailModalIsOpen(false);
            // router.refresh();
            window.location.reload();
        } catch (error) {
            return;
        };
    };

    useEffect(() => {
        async function fetchTeamList() {
            const requestCreatedTeamList = await getApi(`${process.env.NEXT_PUBLIC_API_URL}/team/list/creator`, null, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (requestCreatedTeamList.status === 401) {
                await removeSession();
            };

            if (requestCreatedTeamList.data.content.length > 0) {
                setCreatedTeamList(requestCreatedTeamList.data.content);
            };
        };

        async function fetchJoinedTeamList() {
            const requestJoinedTeamList = await getApi(`${process.env.NEXT_PUBLIC_API_URL}/team/list/member`, null, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (requestJoinedTeamList.status === 401) {
                await removeSession();
            };

            if (requestJoinedTeamList.data.content.length > 0) {
                setJoinedTeamList(requestJoinedTeamList.data.content);
            };
        };

        Promise.all([
            fetchTeamList(),
            fetchJoinedTeamList()
        ])
            .then(() => {
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        if (selectedTeam) {
            setMembers(selectedTeam.teamMemberInfos.map((member) => member.email));
        }
    }, [selectedTeam]);

    if (isLoading) {
        return <Loading />
    };

    return (
        <>
            <h1 className="text-2xl font-bold mb-8">
                팀 목록
            </h1>
            <h2 className="text-xl font-semibold mb-8">
                생성한 팀
            </h2>
            {createdTeamList.length > 0 &&
                <TeamTable
                    list={createdTeamList}
                    setDetailModalIsOpen={setDetailModalIsOpen}
                    setSelectedTeam={setSelectedTeam}
                />
            }
            <div className="w-full h-px bg-gray-200 my-8"></div>
            <h2 className="text-xl font-semibold mb-8">
                소속된 팀
            </h2>
            {joinedTeamList.length > 0 &&
                <TeamTable
                    list={joinedTeamList}
                    setDetailModalIsOpen={setDetailModalIsOpen}
                    setSelectedTeam={setSelectedTeam}
                />
            }
            {createdTeamList.length === 0 && joinedTeamList.length === 0 &&
                <div className="w-full h-[calc(100vh-176px)] flex flex-col gap-4 items-center justify-center">
                    <p className="w-fit">
                        소속된 팀이 없습니다
                    </p>
                    <Link href="/team/create">
                        <Button
                            variant="outline"
                            className="bg-primary-500 text-white"
                        >
                            팀 생성
                        </Button>
                    </Link>
                </div>
            }
            <DetailModal
                title="팀 상세정보"
                isOpen={detailModalIsOpen}
                setIsOpen={setDetailModalIsOpen}
            >
                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)(e);
                        }}
                        className="space-y-8"
                    >
                        <FormField
                            control={form.control}
                            name="teamName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>팀 이름</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            id="teamName"
                                            placeholder="팀명을 입력하세요"
                                            className="rounded-sm"
                                            value={selectedTeam.name || field.value}
                                            onChange={(e) => {
                                                setSelectedTeam({
                                                    ...selectedTeam,
                                                    name: e.target.value
                                                });
                                            }}
                                            required
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="teamDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>설명</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            id="teamDescription"
                                            placeholder="팀 설명을 입력하세요"
                                            className="rounded-sm"
                                            value={selectedTeam.description || field.value}
                                            onChange={(e) => {
                                                setSelectedTeam({
                                                    ...selectedTeam,
                                                    description: e.target.value
                                                });
                                            }}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div>
                            <Label className="text-sm font-medium">팀원</Label>
                            <Input
                                id="teamMembers"
                                placeholder="추가할 팀원의 이메일 주소를 입력해주세요"
                                onChange={(e) => {
                                    setTeamMember(e.target.value);
                                }}
                                value={teamMember}
                                className="rounded-sm my-2"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addMember();
                                    };
                                }}
                            />
                            {teamMember.length > 0 && (
                                <div
                                    className="absolute top-[69px] left-0 right-0 bg-gray-100 p-2"
                                    onClick={addMember}
                                >
                                    {teamMember}
                                </div>
                            )}
                            <div className="w-full flex gap-2 flex-wrap">
                                {members.length > 0 &&
                                    members.map((member, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="w-fit flex items-center gap-2"
                                        >
                                            {member}
                                            <X
                                                className="w-3 h-3"
                                                onClick={() => {
                                                    setMembers(members.filter((m) => m !== member));
                                                }}
                                            />
                                        </Badge>
                                    ))
                                }
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                className="bg-primary-500 text-white"
                            >
                                저장
                            </Button>
                        </div>
                    </form>
                </Form>
            </DetailModal>
        </>
    );
};
